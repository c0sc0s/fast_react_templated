// 系统相关的状态
import { create } from "zustand";

interface AppState {
    hasInit: boolean;
    hasLogin: boolean;
}

interface AppActions {
    setHasInit: (hasInit: boolean) => void;
    setHasLogin: (hasLogin: boolean) => void;
}

const useAppStore = create<AppState & AppActions>((set) => ({
    hasInit: false,
    hasLogin: false,
    setHasInit: (hasInit: boolean) => set({ hasInit }),
    setHasLogin: (hasLogin: boolean) => set({ hasLogin }),
}));

export default useAppStore;
