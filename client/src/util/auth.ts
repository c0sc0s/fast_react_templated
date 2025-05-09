import type { AuthData, UserData } from "@/types";
import useUserStore from "@/store/user";
import useAppStore from "@/store/app";
import clientLocalStorage from "./localStorage";
export const handleAuthSuccess = (data: AuthData) => {
    const { user, token } = data;
    UpdateUserStoreData(user);
    clientLocalStorage.addAuthToken(token);
}

export const UpdateUserStoreData = (data: UserData) => {
    const setHasLogin = useAppStore.getState().setHasLogin;
    const setUser = useUserStore.getState().setUser;

    setHasLogin(true);
    setUser(data);
}