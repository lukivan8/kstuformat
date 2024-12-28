import { useState, useEffect } from "react";
import { pb } from "../lib/pocketbase";

const COUNTER_ID = "3bu3275u9s3571d";
const LOCAL_STORAGE_KEY = "formatCounter";

export const useCounter = () => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const getStoredCount = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        return saved ? parseInt(saved, 10) : 0;
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        return 0;
      }
    };

    setCount(getStoredCount());

    // Then sync with server
    const syncWithServer = async () => {
      try {
        const record = await pb.collection("counter").getOne(COUNTER_ID);
        const serverCount = record.count;
        const localCount = getStoredCount();

        const finalCount = Math.max(serverCount, localCount);

        if (finalCount !== localCount) {
          setCount(finalCount);
          localStorage.setItem(LOCAL_STORAGE_KEY, finalCount.toString());
        }

        if (localCount > serverCount) {
          await pb
            .collection("counter")
            .update(COUNTER_ID, { count: localCount });
        }
      } catch (error) {
        console.error("Error syncing with server:", error);
      }
    };

    syncWithServer();
  }, []);

  const increment = async () => {
    const newCount = count + 1;
    setCount(newCount);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, newCount.toString());
      await pb.collection("counter").update(COUNTER_ID, { count: newCount });
    } catch (error) {
      console.error("Error updating count:", error);
    }
  };

  return { count, increment };
};
