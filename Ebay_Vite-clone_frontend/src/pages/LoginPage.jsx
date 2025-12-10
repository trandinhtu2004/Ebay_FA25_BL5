import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { FaApple, FaFacebook } from 'react-icons/fa';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import FloatingInput from '../components/FloatingInput';

const LoginPage = ({ initialMode = 'login' }) => {
  // Mặc định ban đầu dựa vào prop, nếu không truyền gì thì ưu tiên 'login' (isRegister = false)
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [showPassword, setShowPassword] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsRegister(initialMode === 'register');
  }, [initialMode]);

  const toggleMode = (mode) => {
    setIsRegister(mode === 'register');
  };

  return (
    <div className="min-h-screen flex font-sans text-[#191919] bg-white overflow-hidden">
      
      {/* --- HEADER (LOGO) --- */}
      <header className="px-6 py-4 flex justify-between items-center bg-white z-20 absolute w-full top-0 left-0">
        <Link to="/" className="cursor-pointer">
          <svg className="w-28 h-12" viewBox="0 0 117 48" xmlns="http://www.w3.org/2000/svg">
             <path fill="#e53238" d="M24.355 22.759c-.269-5.738-4.412-7.838-8.826-7.813-4.756.026-8.544 2.459-9.183 7.915zM6.234 26.93c.364 5.553 4.208 8.814 9.476 8.785 3.648-.021 6.885-1.524 7.952-4.763l6.306-.035c-1.187 6.568-8.151 8.834-14.145 8.866C4.911 39.844.043 33.865-.002 25.759c-.05-8.927 4.917-14.822 15.765-14.884 8.628-.048 14.978 4.433 15.033 14.291l.01 1.625z" />
             <path fill="#0064d2" d="M46.544 35.429c5.688-.032 9.543-4.148 9.508-10.32s-3.947-10.246-9.622-10.214-9.543 4.148-9.509 10.32 3.974 10.245 9.623 10.214zM30.652.029l6.116-.034.085 15.369c2.978-3.588 7.1-4.65 11.167-4.674 6.817-.037 14.412 4.518 14.468 14.454.045 8.29-5.941 14.407-14.422 14.454-4.463.026-8.624-1.545-11.218-4.681a33.237 33.237 0 01-.19 3.731l-5.994.034c.09-1.915.185-4.364.174-6.322z" />
             <path fill="#f5af02" d="M77.282 25.724c-5.548.216-8.985 1.229-8.965 4.883.013 2.365 1.94 4.919 6.7 4.891 6.415-.035 9.826-3.556 9.794-9.289v-.637c-2.252.02-5.039.054-7.529.152zm13.683 7.506c.01 1.778.071 3.538.232 5.1l-5.688.032a33.381 33.381 0 01-.225-3.825c-3.052 3.8-6.708 4.909-11.783 4.938-7.532.042-11.585-3.915-11.611-8.518-.037-6.665 5.434-9.049 14.954-9.318 2.6-.072 5.529-.1 7.945-.116v-.637c-.026-4.463-2.9-6.285-7.854-6.257-3.68.021-6.368 1.561-6.653 4.2l-6.434.035c.645-6.566 7.53-8.269 13.595-8.3 7.263-.04 13.406 2.508 13.448 10.192z" />
             <path fill="#86b817" d="M91.939 19.852l-4.5-8.362 7.154-.04 10.589 20.922 10.328-21.02 6.486-.048-18.707 37.251-6.85.039 5.382-10.348-9.887-18.393" />
          </svg>
        </Link>
        
        {/* Link chuyển đổi nhanh ở góc phải */}
        <div className="text-sm z-20 hidden sm:block">
          {isRegister ? (
            <>Already have an account? <Link to="/login" onClick={() => toggleMode('login')} className="text-[#0654ba] underline hover:no-underline font-medium">Sign in</Link></>
          ) : (
            <>New to eBay? <Link to="/register" onClick={() => toggleMode('register')} className="text-[#0654ba] underline hover:no-underline font-medium">Create account</Link></>
          )}
        </div>
      </header>

      {/* --- LEFT SIDE: IMAGE --- */}
      <div className="hidden lg:block w-[55%] relative h-full">
        <img 
          src="https://ir.ebaystatic.com/cr/v/c01/buyer_dweb_individual.jpg" 
          alt="eBay community" 
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* --- RIGHT SIDE: FORM --- */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center px-6 py-12 lg:py-0 overflow-y-auto h-full">
        <div className="w-full max-w-[440px] pt-16 lg:pt-0">
          
          <h1 className="text-[36px] font-bold text-center mb-8 text-[#191919]">
            {isRegister ? 'Create an account' : 'Hello'}
          </h1>

          {/* Toggle Switch (Đã đảo: Login trái, Register phải) */}
          <div className="flex bg-white border border-gray-300 rounded-full p-[2px] mb-8 relative">
            <div 
              // Logic slider: Nếu là Login (!isRegister) thì ở trái (2px), Register thì ở phải (50%)
              className={`absolute top-[2px] bottom-[2px] w-[calc(50%-2px)] bg-[#191919] rounded-full transition-all duration-300 ease-in-out ${!isRegister ? 'left-[2px]' : 'left-[calc(50%)]'}`}
            ></div>
            
            <button 
              onClick={() => toggleMode('login')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-colors z-10 ${!isRegister ? 'text-white' : 'text-[#707070] hover:bg-gray-50'}`}
            >
              Sign in
            </button>

            <button 
              onClick={() => toggleMode('register')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-colors z-10 ${isRegister ? 'text-white' : 'text-[#707070] hover:bg-gray-50'}`}
            >
              Register
            </button>
          </div>

          {/* Form Fields */}
          <form className="flex flex-col gap-4">
            
            {/* Chỉ hiện First/Last Name khi ở tab Register */}
            {isRegister && (
              <div className="flex gap-4">
                <FloatingInput label="First name" type="text" />
                <FloatingInput label="Last name" type="text" />
              </div>
            )}

            <FloatingInput label="Email" type="email" />
            
            <div className="relative">
              <FloatingInput 
                label="Password" 
                type={showPassword ? "text" : "password"} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-gray-500 hover:text-black"
              >
                {showPassword ? <BsEyeSlash size={20} /> : <BsEye size={20} />}
              </button>
            </div>

            {/* Legal Text (cho Register) hoặc Forgot Password (cho Login) */}
            {isRegister ? (
               <p className="text-xs text-[#707070] mt-2 leading-tight">
                 By selecting <b>Create personal account</b>, you agree to our <a href="#" className="text-[#0654ba] underline">User Agreement</a> and acknowledge reading our <a href="#" className="text-[#0654ba] underline">User Privacy Notice</a>.
               </p>
            ) : (
              <div className="text-center mt-2">
                 <a href="#" className="text-[#0654ba] text-sm font-bold hover:underline">Forgot password?</a>
              </div>
            )}

            {/* Submit Button */}
            <button className="w-full bg-[#3665f3] hover:bg-[#2b50c4] text-white font-bold h-12 rounded-full mt-2 transition-colors text-[16px]">
              {isRegister ? 'Create personal account' : 'Sign In'}
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-2 my-8">
            <div className="h-[1px] bg-gray-300 flex-1"></div>
            <span className="text-xs text-[#707070] px-2">or continue with</span>
            <div className="h-[1px] bg-gray-300 flex-1"></div>
          </div>

          {/* Social Buttons */}
          <div className="flex gap-4 h-12">
            <button className="flex-1 flex items-center justify-center border border-gray-400 rounded-full hover:bg-gray-100 transition font-bold text-[#191919] group">
              <FcGoogle size={24} className="mr-2" /> <span className="text-sm">Google</span>
            </button>
          </div>
          
          {/* Footer nhỏ ở dưới cùng cho mobile */}
          <div className="mt-8 text-center lg:hidden">
             <p className="text-xs text-gray-500">Copyright © 1995-2025 eBay Inc.</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;