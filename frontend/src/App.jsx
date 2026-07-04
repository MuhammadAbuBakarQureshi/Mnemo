import { useEffect } from "react";
import Sidebar from "./Components/SideBar/Sidebar";
import { useAuthStore } from "./authstore";

export default function App() {

  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {

    console.log(accessToken)

    const new_token = async () => { 

      try{

        if (!accessToken){

          const refresh_token = localStorage.getItem("refresh_token")

          console.log(refresh_token);
          
          const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {

            method: "POST",
            headers: { "Content-Type" : "application/json" },
            body: JSON.stringify({
              grant_type: "refresh_token",
              client_id: AUTH0_CLIENT_ID,
              refresh_token: refresh_token
            })
          })

          const new_tokens = await response.json()
          
          console.log(new_tokens);

          if (!response.ok){

            localStorage.setItem("refresh_token", new_tokens.refresh_token)
            setAccessToken(new_tokens.access_token)
          }
        }
      } catch (e) {

        console.log(e)
      }
    }

    // if (localStorage.getItem("refresh_token")){
      
    //   new_token()
    // }

    }, [])


  return (

    <Sidebar />
  );
}
