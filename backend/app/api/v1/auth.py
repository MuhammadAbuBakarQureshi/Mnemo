from jose import jwt
import requests
from fastapi import APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from dotenv import load_dotenv
import os

router = APIRouter()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_CLIENT_SECRET = os.getenv("AUTH0_CLIENT_SECRET")


ALGORITHMS = ["RS256"]

def get_jwks():

    return requests.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json").json()

def verify_token(request: Request):

    try:

        token = request.cookies.get("access_token")
        
        print("passed_1")

        if not token:

            raise HTTPException(status_code=401, detail="Not Authenticated")

        print("passed_2")

        jwks = get_jwks()
        unverified_token = jwt.get_unverified_header(token)

        print("passed_3")

        rsa_key = {}

        for key in jwks["keys"]:
            if key["kid"] == unverified_token["kid"]:

                rsa_key = {

                    "kty": key["kty"],
                    "kid": key["kid"],
                    "n": key["n"],
                    "e": key["e"],
                }

        print("passed_4")

        if not rsa_key:

            raise HTTPException(status_code=401, detail="Invalid token header")
        

        payload = jwt.decode(
            token,
            rsa_key,
            audience=AUTH0_AUDIENCE,
            algorithms=ALGORITHMS,
            issuer=f"https://{AUTH0_DOMAIN}/",
        )

        print("passed_5")

        return payload

    except Exception as e:

        print(f"Authentication Error: {e}")
        


@router.post("/refresh")
def refresh_tokens(response: Response, request: Request):

    try:

        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")
        
        if not access_token and refresh_token:

            URL = f"https://{AUTH0_DOMAIN}/oauth/token"

            request_body = {
                "grant_type": "refresh_token",
                "client_id": AUTH0_CLIENT_ID,
                "refresh_token": refresh_token
            }

            auth0_response = requests.post(URL,
                                        json=request_body)

            tokens = auth0_response.json()

            if "access_token" not in tokens:

                raise HTTPException(status_code=401, detail="Refresh failed")

            response.set_cookie(
                key="access_token",
                value=tokens["access_token"],
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=tokens["expires_in"]
            )

            response.set_cookie(
                key="refresh_token",
                value=tokens["refresh_token"],
                httponly=True,
                secure=False,
                samesite="lax",
                max_age= 30 * 24 * 60 * 60
            )
            
        return { "message" : "Token Refreshed" }

    except Exception as e:

        print(f"Auth0 token update: {e}")