export const generateRandomCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const digits = '0123456789'

    // Define the pattern of your code here, L for letter, D for digit
    const pattern = ['L', 'D', 'L', 'D', 'L']

    return pattern
        .map(type => {
            if (type === 'L') {
                return letters.charAt(Math.floor(Math.random() * letters.length))
            } else {
                return digits.charAt(Math.floor(Math.random() * digits.length))
            }
        })
        .join('')
}
