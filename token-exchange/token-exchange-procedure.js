/**
 * @param {se.curity.identityserver.procedures.context.TokenExchangeProcedureContext} context
 */
function result(context) {
  var accessTokenData = context.getDefaultAccessTokenData(context.delegation);
  var presentedTokenData = context.presentedToken.data;

  // First token exchange
  if (!presentedTokenData.act) {
    accessTokenData.act = [{ sub: accessTokenData._clientId }];
  } else {
    // Subsequent token exchanges
    presentedTokenData.act.add({ sub: accessTokenData._clientId });
    accessTokenData.act = presentedTokenData.act;
  }

  var issuedAccessToken = context.accessTokenIssuer.issue(accessTokenData, context.delegation);
  return {
    scope: accessTokenData.scope,
    access_token: issuedAccessToken,
    token_type: 'bearer',
    expires_in: secondsUntil(accessTokenData.exp)
  };
}
