import { distributeXP, getUserPoint, setMultiplier } from './controller/point'
import { getUserReferral, redeemInviteCode, validateInviteCode, generateInviteCode } from './controller/referral'
export default function routes(app: any) {
  // Admin Routes
  app.post('/api/referral/admin/generate', generateInviteCode)
  app.post('/api/referral/admin/distributeXP', distributeXP)
  app.post('/api/referral/admin/setMultiplier', setMultiplier)

  // User Routes
  app.post('/api/referral/user/validate', validateInviteCode)
  app.post('/api/referral/user/redeem', redeemInviteCode)
  app.get('/api/referral/user/:account', getUserReferral)

  app.get('/api/point/user/:account', getUserPoint)

}
