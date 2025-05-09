import type { UserData } from "@/types";
import { create } from "zustand";

interface UserState {
    user: UserData | null;
}

interface UserActions {
    setUser: (user: UserData | null) => void;
}

const useUserStore = create<UserState & UserActions>((set) => ({
    user: null,
    setUser: (user: UserData | null) => set({ user }),
}));

export default useUserStore;

