#  Token Exchange Flow Example

## Scenario
Client App (opaque AT) -> API GW -> Service-1 ->Service-2


## Curity Setup to run the example
1. Create 4 OAuth clients in the token service profile to run the example.

| Client ID           | Capabilities          | Scopes                           | Notes                                                          |
| --------------------|:----------------------| ---------------------------------|----------------------------------------------------------------|
| www                 | code                  | openid profile read write delete | Client App OAuth Client authorized by the user
| api-gw              | token-exchange        | openid profile read write delete | API gateway exchanges original token for a token with same scopes
| service-1           | token-exchange        | read write delete                | service-1 exchanges token for a new token with less scopes than the incoming token
| service-2           | token-exchange        | read write                       | service-2 exchanges token for a new token with less scopes than the incoming token

2. Add the following procedure code to the `oauth-token-token-exchange` flow

 ```js
  /**
 * @param {se.curity.identityserver.procedures.context.TokenExchangeProcedureContext} context
 */
function result(context) {

	var accessTokenData = context.getDefaultAccessTokenData(context.delegation)
	var presentedTokenData = context.presentedToken.data

	// First token exchange 
	if (!presentedTokenData.act) {
		accessTokenData.act = [{ "sub": accessTokenData._clientId }]

	} else {
	// Subsequent token exchanges
		presentedTokenData.act.add({ "sub": accessTokenData._clientId })  
		accessTokenData.act = presentedTokenData.act
	}

	var issuedAccessToken = context.accessTokenIssuer.issue(accessTokenData, context.delegation);
	return {
		scope: accessTokenData.scope,
		access_token: issuedAccessToken,
		token_type: 'bearer',
		expires_in: secondsUntil(accessTokenData.exp)
	};
}

 ```

 ```xml
<config xmlns="http://tail-f.com/ns/config/1.0">
  <processing xmlns="https://curity.se/ns/conf/base">
  <procedures>
  <token-procedure>
    <id>token-exchange-proc</id>
    <flow>oauth-token-token-exchange</flow>
    <script>LyoqCiAqIEBwYXJhbSB7c2UuY3VyaXR5LmlkZW50aXR5c2VydmVyLnByb2NlZHVyZXMuY29udGV4dC5Ub2tlbkV4Y2hhbmdlUHJvY2VkdXJlQ29udGV4dH0gY29udGV4dAogKi8KZnVuY3Rpb24gcmVzdWx0KGNvbnRleHQpIHsKCgl2YXIgYWNjZXNzVG9rZW5EYXRhID0gY29udGV4dC5nZXREZWZhdWx0QWNjZXNzVG9rZW5EYXRhKGNvbnRleHQuZGVsZWdhdGlvbikKCXZhciBwcmVzZW50ZWRUb2tlbkRhdGEgPSBjb250ZXh0LnByZXNlbnRlZFRva2VuLmRhdGEKCgkvLyBGaXJzdCB0b2tlbiBleGNoYW5nZSAKCWlmICghcHJlc2VudGVkVG9rZW5EYXRhLmFjdCkgewoJCWFjY2Vzc1Rva2VuRGF0YS5hY3QgPSBbeyAic3ViIjogYWNjZXNzVG9rZW5EYXRhLl9jbGllbnRJZCB9XQoKCX0gZWxzZSB7CgkvLyBTdWJzZXF1ZW50IHRva2VuIGV4Y2hhbmdlcwoJCXByZXNlbnRlZFRva2VuRGF0YS5hY3QuYWRkKHsgInN1YiI6IGFjY2Vzc1Rva2VuRGF0YS5fY2xpZW50SWQgfSkgIAoJCWFjY2Vzc1Rva2VuRGF0YS5hY3QgPSBwcmVzZW50ZWRUb2tlbkRhdGEuYWN0Cgl9CgoJdmFyIGlzc3VlZEFjY2Vzc1Rva2VuID0gY29udGV4dC5hY2Nlc3NUb2tlbklzc3Vlci5pc3N1ZShhY2Nlc3NUb2tlbkRhdGEsIGNvbnRleHQuZGVsZWdhdGlvbik7CglyZXR1cm4gewoJCXNjb3BlOiBhY2Nlc3NUb2tlbkRhdGEuc2NvcGUsCgkJYWNjZXNzX3Rva2VuOiBpc3N1ZWRBY2Nlc3NUb2tlbiwKCQl0b2tlbl90eXBlOiAnYmVhcmVyJywKCQlleHBpcmVzX2luOiBzZWNvbmRzVW50aWwoYWNjZXNzVG9rZW5EYXRhLmV4cCkKCX07Cn0=</script>
  </token-procedure>
  </procedures>
  </processing>
</config>
 ```

 The above procedure adds an `act` claim in to the exchanged token which contains the client-id of the service that called the token-exchange endpoint.


 ## Flow

 1. Client application runs `authorization-code` flow and the user authorizes the app to act on his behalf resulting in an access token being returned to the client application with the requested scopes.
 
 Access token : `_0XBPWQQ_13d52d05-cf10-4e20-b71a-ce71e5b53ceb`

 ```json
 {
  "sub": "379ddd8b4091a829434f1192d1ad7f94b4977b0cf909890b5ae0ff3b47dfbe12",
  "purpose": "access_token",
  "iss": "https://login-external.curity.local/external/~",
  "active": true,
  "token_type": "bearer",
  "client_id": "www",
  "aud": "www",
  "nbf": 1659691756,
  "scope": "openid profile read write delete",
  "exp": 1659694756,
  "delegationId": "7ab426fe-d8d9-495d-a66d-cb1b8b988bdf",
  "iat": 1659691756
}
 ```

2. Client application calls service-1 via an API-GW which exchanges the token, resulting in a new token with `act` claim being added to the exchanged token.

```
curl --location --request POST 'https://login-external.curity.local/external/oauth-token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'token=_0XBPWQQ_13d52d05-cf10-4e20-b71a-ce71e5b53ceb' \
--data-urlencode 'client_id=API-GW' \
--data-urlencode 'client_secret=www' \
--data-urlencode 'scope=openid profile read write delete' \
--data-urlencode 'grant_type=https://curity.se/grant/accesstoken'

```

Access token : `_0XBPWQQ_19ce7256-e7e2-4b5b-8dd6-220e4dbeae68`

```json
{
  "sub": "379ddd8b4091a829434f1192d1ad7f94b4977b0cf909890b5ae0ff3b47dfbe12",
  "purpose": "access_token",
  "iss": "https://login-external.curity.local/external/~",
  "active": true,
  "token_type": "bearer",
  "client_id": "www",  // original client
  "aud": "API-GW",
  "nbf": 1659691980,
  "act": [{ "sub": "API-GW" }],  // client id of API Gateway OAuth client added in the act claim
  "scope": "read openid profile write delete",
  "exp": 1659694756,
  "delegationId": "7ab426fe-d8d9-495d-a66d-cb1b8b988bdf",
  "iat": 1659691980
}

```

3. Service-1 further exchanges the token for a new token with reduced scopes

```
curl --location --request POST 'https://login-external.curity.local/external/oauth-token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'token=_0XBPWQQ_19ce7256-e7e2-4b5b-8dd6-220e4dbeae68' \
--data-urlencode 'client_id=service-1' \
--data-urlencode 'client_secret=www' \
--data-urlencode 'scope=read write delete' \
--data-urlencode 'grant_type=https://curity.se/grant/accesstoken'
```

Access token  : `_0XBPWQQ_de52f0d4-0af6-44ff-8040-9e4994ab87e0`

```json
{
  "sub": "379ddd8b4091a829434f1192d1ad7f94b4977b0cf909890b5ae0ff3b47dfbe12",
  "purpose": "access_token",
  "iss": "https://login-external.curity.local/external/~",
  "active": true,
  "token_type": "bearer",
  "client_id": "www",
  "aud": "service-1",
  "nbf": 1659692117,
  "act": [{ "sub": "API-GW" }, { "sub": "service-1" }], // client id of service-1 added to the act claim along with the previous actors
  "scope": "read write delete", // reduced scopes
  "exp": 1659694756,
  "delegationId": "7ab426fe-d8d9-495d-a66d-cb1b8b988bdf",
  "iat": 1659692117
}

```

4. service - 2 further exchanges the token for a new token with reduced scopes

```
curl --location --request POST 'https://login-external.curity.local/external/oauth-token' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'token=_0XBPWQQ_de52f0d4-0af6-44ff-8040-9e4994ab87e0' \
--data-urlencode 'client_id=service-2' \
--data-urlencode 'client_secret=www' \
--data-urlencode 'scope=read write' \
--data-urlencode 'grant_type=https://curity.se/grant/accesstoken'

```

Access token : `_0XBPWQQ_26d6867f-99b0-4e9c-976f-f731829413cc`

```json
{
  "sub": "379ddd8b4091a829434f1192d1ad7f94b4977b0cf909890b5ae0ff3b47dfbe12",  // user
  "purpose": "access_token",
  "iss": "https://login-external.curity.local/external/~",
  "active": true,
  "token_type": "bearer",
  "client_id": "www", // original client
  "aud": "service-2",
  "nbf": 1659692211,
  "act": [{ "sub": "API-GW" }, { "sub": "service-1" }, { "sub": "service-2" }], // actors
  "scope": "read write", // reduced scopes
  "exp": 1659694756,
  "delegationId": "7ab426fe-d8d9-495d-a66d-cb1b8b988bdf",
  "iat": 1659692211
}

```


Note : It is not possible to exchange an original token for a new token with more scopes than authorized by the user originally.