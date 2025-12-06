import React, { useEffect, useState } from 'react';

interface PlantechXLoaderProps {
  message?: string;
}

const PlantechXLoader: React.FC<PlantechXLoaderProps> = ({ message = 'Loading...' }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const particleArray = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2
    }));
    setParticles(particleArray);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-blue-500 rounded-full animate-float opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`
          }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-radial from-blue-100/30 via-transparent to-transparent animate-pulse-slow" />

      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        <div className="relative perspective-1000">
          <div className="relative w-48 h-48 transform-style-3d animate-rotate-y">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-3xl shadow-2xl opacity-40 blur-xl animate-pulse" />

            <div className="absolute inset-4 bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-700 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-cube animate-float">
              <div className="text-white font-bold text-4xl tracking-wider drop-shadow-2xl animate-glow">
                P<span className="text-cyan-200">X</span>
              </div>
            </div>

            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-3xl opacity-20 blur-2xl animate-spin-slow" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-blue-300/40 rounded-full animate-ping-slow" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-cyan-300/30 rounded-full animate-spin-reverse" />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-800 tracking-widest animate-slide-up">
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0s' }}>P</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.1s' }}>l</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.2s' }}>a</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.3s' }}>n</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.4s' }}>t</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.5s' }}>e</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.6s' }}>c</span>
            <span className="inline-block animate-bounce-letter" style={{ animationDelay: '0.7s' }}>h</span>
            <span className="inline-block text-blue-600 animate-bounce-letter mx-1" style={{ animationDelay: '0.8s' }}>X</span>
          </h1>

          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>

          <p className="text-gray-600 text-lg font-medium animate-pulse-slow">{message}</p>
        </div>

        <div className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 rounded-full animate-loading-bar" />
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }

        @keyframes rotate-y {
          0% {
            transform: rotateY(0deg) rotateX(0deg);
          }
          50% {
            transform: rotateY(180deg) rotateX(10deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(0deg);
          }
        }

        @keyframes rotate-cube {
          0%, 100% {
            transform: rotateX(0deg) rotateY(0deg);
          }
          25% {
            transform: rotateX(15deg) rotateY(90deg);
          }
          50% {
            transform: rotateX(0deg) rotateY(180deg);
          }
          75% {
            transform: rotateX(-15deg) rotateY(270deg);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: scale(1);
            opacity: 0.3;
          }
        }

        @keyframes bounce-letter {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(59, 130, 246, 0.8),
                         0 0 40px rgba(59, 130, 246, 0.6),
                         0 0 60px rgba(59, 130, 246, 0.4);
          }
          50% {
            text-shadow: 0 0 30px rgba(34, 211, 238, 0.9),
                         0 0 60px rgba(34, 211, 238, 0.7),
                         0 0 90px rgba(34, 211, 238, 0.5);
          }
        }

        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-rotate-y {
          animation: rotate-y 6s linear infinite;
        }

        .rotate-cube {
          animation: rotate-cube 8s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 6s linear infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s ease-in-out infinite;
        }

        .animate-bounce-letter {
          animation: bounce-letter 1.5s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .perspective-1000 {
          perspective: 1000px;
        }

        .transform-style-3d {
          transform-style: preserve-3d;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default PlantechXLoader;