import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface CounterProps {
  count: number;
}

const Counter: React.FC<CounterProps> = ({ count }) => {
  const digits = count.toString().padStart(4, "0").split("");
  const prevDigitsRef = useRef(digits);

  useEffect(() => {
    prevDigitsRef.current = digits;
  }, [count]);

  return (
    <Card className="shadow-lg p-4 w-fit mx-auto">
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-gray-600 mt-1">Обработано файлов</p>
        <div className="flex gap-1">
          {digits.map((digit, index) => (
            <div
              key={`digit-container-${index}`}
              className="relative bg-white w-10 h-14 rounded-lg shadow-sm flex items-center justify-center overflow-hidden"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={`${index}-${digit}`}
                  initial={{
                    y: 50,
                    opacity: 0,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  exit={{
                    y: -50,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  className="font-mono font-bold text-2xl text-blue-700/90 absolute"
                >
                  {digit}
                </motion.div>
              </AnimatePresence>

              {/* Border effect */}
              <div className="absolute inset-0 border border-blue-100 rounded-lg" />

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent" />

              {/* Number change flash effect */}
              {prevDigitsRef.current[index] !== digits[index] && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 1.2 }}
                  animate={{ opacity: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-blue-100 rounded-lg"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default Counter;
