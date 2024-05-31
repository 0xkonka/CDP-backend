import telebot
import json
import os
import requests
from dotenv import load_dotenv
from datetime import datetime

# Replace with your bot token
load_dotenv('.env')
bot_token = "6576986771:AAEMzm9dTfsv16hceblh39Dd6ZgO0QU2sIo"
print(f"{bot_token}")
bot = telebot.TeleBot(bot_token)

# File to store user data
user_data_file = './user_data.json'

# Admin user IDs
admin_user_ids = [6169299399, 1728930954]  # Replace with your Telegram user ID

# Admin state to track broadcast messages
admin_broadcast_state = {}

# Load existing user data from file
if os.path.exists(user_data_file) and os.path.getsize(user_data_file) > 0:
    with open(user_data_file, 'r') as f:
        user_data = json.load(f)
        print(f"{user_data}")
else:
    user_data = {}

def save_user_data():
    with open(user_data_file, 'w') as f:
        json.dump(user_data, f)

def get_user_xp(address):
    try:
        response = requests.get(f'https://be-express-lime.vercel.app/api/point/user/{address}')
        response.raise_for_status()
        data = response.json()
        print(f'{data}')  # Debugging statement to print the entire response
        point_data = data.get('data', {}).get('point', None)
        if point_data is None:
            return None, None, None, None, None
        
        rank = data.get('data', {}).get('rank', 'No rank data found')
        xp_point = point_data.get('xpPoint', 'No XP data found')
        multiplier_permanent = point_data.get('multiplier_permanent', 'No multiplier_permanent data found')
        multiplier_temporary = point_data.get('multiplier_temporary', 'No multiplier_temporary data found')
        end_timestamp = 0
        if multiplier_temporary > 0:
            end_timestamp = point_data.get('endTimestamp', None)

        # Calculate the remaining time if endTimestamp is provided
        remaining_time = None
        if end_timestamp > 0:
            end_date = datetime.fromtimestamp(end_timestamp)
            current_date = datetime.now()
            remaining_duration = end_date - current_date
            remaining_time = str(remaining_duration).split('.')[0]  # Format as 'days, hours:minutes:seconds'

        return xp_point, multiplier_permanent, multiplier_temporary, rank, remaining_time
    except requests.RequestException as e:
        print(f"An error occurred while fetching XP: {e}")
        return 'Error fetching XP data', None, None, None, None

def is_admin(user_id):
    return user_id in admin_user_ids

@bot.message_handler(commands=['start'])
def start(message):
    chat_id = message.chat.id
    print(f"Received /start command from chat_id: {chat_id}")  # Debugging statement
    if str(chat_id) in user_data:
        bot.reply_to(message, 'Welcome back! You can check your XP points using the /xp command.')
    else:
        user_data[str(chat_id)] = {'wallet': None}
        save_user_data()
        print(f"New user added: {chat_id}")
        
        welcome_message = (
            "Welcome to Tren Finance!\n\n"
            "Tren Finance is a DeFi protocol developed by a team of experienced DeFi enthusiasts, aiming to unlock greater capital efficiency for a wide range of crypto assets. "
            "The protocol addresses a critical challenge: the limited support for diverse tokens in existing DeFi platforms, resulting in a 'metaphoric wall' that hinders effective use of these assets.\n\n"
            "One of the critical limitations of current DeFi lending and borrowing markets is the restricted list of eligible collateral assets, which often includes only mainstream tokens. "
            "This limitation bars a significant portion of DeFi assets from participation, particularly long-tail assets that, despite their potential, introduce higher risks. "
            "Tren Finance addresses this by implementing isolated risk modules. These modules contain risks within individual pools, allowing for asset-specific risk parameters and thus enabling a broader range of assets to be safely integrated as collateral. "
            "This not only expands options for users but also enhances the overall system's resilience against systemic risks.\n\n"
            "You can check your XP points using our bot by entering the /xp command after you have provided your wallet address."
        )
        
        bot.reply_to(message, welcome_message)
        bot.reply_to(message, 'Please enter your wallet address.')

@bot.message_handler(commands=['xp'])
def show_xp(message):
    chat_id = message.chat.id
    print(f"Received /xp command from chat_id: {chat_id}")  # Debugging statement
    print(f"{user_data}")
    if str(chat_id) in user_data and user_data[str(chat_id)]['wallet']:
        wallet = user_data[str(chat_id)]['wallet']
        print(f"Wallet address for chat_id {chat_id}: {wallet}")  # Debugging statement
        xp, multiplier_permanent, multiplier_temporary, rank, remaining_time = get_user_xp(wallet)
        if xp is None and rank is None:
            bot.reply_to(message, "You don't have any points.")
        elif xp is not None:
            if rank == 0:
                rank_emoticon = "😞"
            elif 1 <= rank <= 5:
                rank_emoticon = "🏆"
            else:
                rank_emoticon = "🙂"

            response_message = (
                f"address: {wallet}\n"
                f"Your XP points: {xp}\n"
                f"Permanent Multiplier: {multiplier_permanent}\n"
                f"Temporary Multiplier: {multiplier_temporary}\n"
                f"XP Rank: {rank} {rank_emoticon}"
            )
            if remaining_time:
                response_message += f"\nTime left: {remaining_time}"
            bot.reply_to(message, response_message)
        else:
            bot.reply_to(message, 'Error fetching XP data.')
    else:
        bot.reply_to(message, 'Wallet address not found. Please enter your wallet address first.')

@bot.message_handler(commands=['broadcast'])
def broadcast(message):
    chat_id = message.chat.id
    if is_admin(chat_id):
        admin_broadcast_state[chat_id] = True
        bot.reply_to(message, 'Please provide a message to broadcast.')
    else:
        bot.reply_to(message, 'You are not authorized to use this command.')

@bot.message_handler(func=lambda message: True)
def handle_message(message):
    chat_id = message.chat.id
    print(f"Received message from chat_id: {chat_id}")  # Debugging statement
    
    # Check if admin is in the state of providing a broadcast message
    if chat_id in admin_broadcast_state:
        broadcast_message = message.text
        if broadcast_message:
            for user_id in user_data:
                try:
                    bot.send_message(user_id, broadcast_message)
                except telebot.apihelper.ApiTelegramException as e:
                    print(f"Failed to send message to {user_id}: {e}")
            bot.reply_to(message, 'Broadcast message sent to all users.')
        else:
            bot.reply_to(message, 'Please provide a message to broadcast.')
        del admin_broadcast_state[chat_id]  # Clear the admin state after broadcasting
        return

    # Handle regular messages (e.g., wallet address input)
    if message.text.startswith('/'):
        # Ignore command messages
        return

    if str(chat_id) in user_data and user_data[str(chat_id)]['wallet'] is None:
        user_data[str(chat_id)]['wallet'] = message.text
        save_user_data()
        bot.reply_to(message, 'Wallet address saved. Thank you! You can now use the /xp command to check your XP points.')
        print(f"Wallet address for {chat_id} saved: {message.text}")
    else:
        bot.reply_to(message, 'You have already provided your wallet address.')

def broadcast_message_to_all(message):
    for chat_id in user_data:
        try:
            bot.send_message(chat_id, message)
        except telebot.apihelper.ApiTelegramException as e:
            print(f"Failed to send message to {chat_id}: {e}")

def send_message_to_channel(message, channel_id):
    try:
        bot.send_message(channel_id, message)
        print(f"Message sent to channel {channel_id}")
    except telebot.apihelper.ApiTelegramException as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    # Delete webhook if it exists
    bot.remove_webhook()

    # Start polling
    bot.polling()

    # Example of broadcasting a message
    # Uncomment the lines below to broadcast a message to all users
    # example_message = "This is a test message."
    # broadcast_message_to_all(example_message)

    # Example of sending a message to a channel
    # Uncomment the lines below to send a message to the channel
