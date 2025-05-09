import { useEffect } from "react";

import useAppStore from "@/store/app";
import { useRef } from "react";
import UserStore from "@/store/user";
import clientLocalStorage from "@/util/localStorage";
import { getMe } from "@/api/auth";
import { UpdateUserStoreData } from "@/util/auth";


export function useAuthInit() {
    const setUser = UserStore((state) => state.setUser);
    const setHasLogin = useAppStore((state) => state.setHasLogin);
    const setHasInit = useAppStore((state) => state.setHasInit);

    const isMounted = useRef(false);

    useEffect(() => {
        // 此 hook 全局只执行一次
        if (isMounted.current) return;
        isMounted.current = true;

        const authToken = clientLocalStorage.getAuthToken();

        if (!authToken) {
            setUser(null);
            setHasLogin(false);
            setHasInit(true);
            return;
        }
        getMe()
            .then((res) => {
                UpdateUserStoreData(res.user);
            })
            .catch(() => {
                setUser(null);
                clientLocalStorage.removeAuthToken();
            }).finally(() => {
                setHasInit(true);
            });
    }, []);
}