import { AuroraText } from '@/components/ui/aurora-text'
import { LoginForm } from './login-form'
import { ThemeSwitch } from '@/components/theme-switch'


export function SignIn() {
  return (
    <div className='relative container grid min-h-svh flex-col justify-center lg:max-w-none lg:grid-cols-[57fr_43fr] lg:px-0'>
      <div className='absolute top-4 right-4'>
        <ThemeSwitch />
      </div>
      <div className='relative hidden h-full min-h-svh items-center justify-center overflow-hidden bg-background lg:flex dark:border-r'>
        <img
          src='images/Auth_Image.png'
          alt='Auth background'
          className='absolute inset-0 w-full h-full object-cover object-top'
        />
      </div>

      <div className='flex items-center justify-center lg:p-8'>
        <div className='mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[500px]'>
          <div className='flex flex-col text-left'>
            <AuroraText className='text-center text-3xl font-bold'>
              AstroIntern
            </AuroraText>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}