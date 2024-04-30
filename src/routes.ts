import { getUserReferral, redeemInviteCode, validateInviteCode, generateInviteCode } from './controller/referral'
export default function routes(app: any) {
  // Admin Routes
  app.post('/api/referral/admin/generate', generateInviteCode)

  // User Routes
  app.post('/api/referral/user/validate', validateInviteCode)
  app.post('/api/referral/user/redeem', redeemInviteCode)
  app.get('/api/referral/user/:account', getUserReferral)

  // app.get('/api/referral/:account', async (req, res, next) => {
  //   const account = req.params.account
  //   let data
  //   try {
  //     data = await getUserReferral(account)
  //     const {
  //       distributions,
  //       affiliateTotalStats,
  //       affiliateLastDayStats,
  //       referralCodes,
  //       referralTotalStats,
  //       affiliateTierInfo,
  //     } = data

  //     res.set('Cache-Control', 'max-age=60')
  //     res.send({
  //       distributions,
  //       affiliateTotalStats,
  //       affiliateLastDayStats,
  //       referralCodes,
  //       referralTotalStats,
  //       affiliateTierInfo,
  //     })
  //   } catch (ex) {
  //     next(ex)
  //     return
  //   }
  // })

  // app.get('/api/referrer', async (req, res, next) => {
  //   const tierIds = req.query.tierId
  //   let data
  //   try {
  //     data = await getReferrersTiers(JSON.parse(tierIds))
  //     const { referrer } = data

  //     res.set('Cache-Control', 'max-age=60')
  //     res.send({
  //       referrer,
  //     })
  //   } catch (ex) {
  //     next(ex)
  //     return
  //   }
  // })
}
