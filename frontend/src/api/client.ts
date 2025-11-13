import axios from "axios";
// Prueba con 127.0.0.1 para evitar rarezas de resolución
export const api = axios.create({ baseURL: "http://127.0.0.1:8000" });

// Adjuntar token almacenado (vi.auth o vi_auth) a cada request
api.interceptors.request.use((config) => {
    try{
        const raw = localStorage.getItem("vi.auth") ?? localStorage.getItem("vi_auth");
        if (raw)  {
            const { token } = JSON.parse(raw);
            if (token)  {
                // Axios v1: headers puede ser AxiosHeaders (time .set) o un objeto plano
                if (config.headers &&  typeof (config.headers as any).set === "function"){
                    (config.headers as any).set("Authorization", `Bearer ${token}`);
                } else {
                config.headers =  { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any;
                }
            } 
        } 
    } catch {}
    return config;
});