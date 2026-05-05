import { motion } from "framer-motion";

const BucketLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      {/* Bucket SVG with fill animation */}
      <div className="relative w-16 h-20">
        {/* Bucket body */}
        <svg viewBox="0 0 64 80" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bucket handle */}
          <path
            d="M16 20 C16 8, 48 8, 48 20"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bucket shape */}
          <path
            d="M8 28 L14 72 C14 76, 50 76, 50 72 L56 28 Z"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2.5"
            fill="none"
          />
          {/* Bucket rim */}
          <ellipse cx="32" cy="28" rx="24" ry="6" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" fill="hsl(var(--background))" />
          
          {/* Water fill - animated */}
          <clipPath id="bucketClip">
            <path d="M10 30 L15 70 C15 74, 49 74, 49 70 L54 30 Z" />
          </clipPath>
          <g clipPath="url(#bucketClip)">
            <motion.rect
              x="8"
              width="48"
              height="50"
              fill="hsl(var(--primary))"
              opacity={0.3}
              initial={{ y: 75 }}
              animate={{ y: 50 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
            {/* Wave effect */}
            <motion.ellipse
              cx="32"
              rx="26"
              ry="4"
              fill="hsl(var(--primary))"
              opacity={0.5}
              initial={{ cy: 75 }}
              animate={{ cy: 52 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
          </g>
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Buck-et, we ball. Join sidequests, have fun.
      </p>
    </div>
  );
};

export default BucketLoader;
