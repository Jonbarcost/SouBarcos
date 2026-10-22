import "server-only";
import { checkedConfig } from "./zoho-security";
export const ZOHO_CALLBACK_PATH = "/api/integrations/zoho/callback";
export const zohoClientConfig = () => checkedConfig(process.env);
export const zohoRedirectUri = () => checkedConfig(process.env).redirectUri;
