import Header from "@/components/Header"
import logo from "@/assets/logo.png"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc";



const SignInPage = () => {
  const form = useForm()

  const onSubmit = (data: any) => {
    console.log(data)
  }

  return (
    <div className='h-screen w-full overflow-hidden'>
      <Header />
      <div className='container mx-auto h-full w-full flex flex-col items-center justify-center gap-6'>
        <div className=' w-[600px] h-fit p-2 rounded-xl '>
          <div className='flex flex-col items-center justify-center gap-4'>
            <img src={logo} alt="logo" className="w-32 h-32" />
            <p className="text-2xl font-medium">Sign In to your account</p>
            <div className='bg-[#222222] w-[600px] h-fit p-4 rounded-xl border border-gray-600/30 flex flex-col'>
              <div className="flex flex-col gap-3">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="border-none bg-[#2A2A2A] outline-none focus:outline-none"
                            placeholder="example@email.com"
                            type="email"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="border-none bg-[#2A2A2A] outline-none focus:outline-none"
                            placeholder="********"
                            type="password"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            className="border-none bg-[#2A2A2A] outline-none focus:outline-none"
                            placeholder="Enter your name"
                            type="text"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="bg-[#9F9FF8]" onClick={form.handleSubmit(onSubmit)}>Sign In</Button>
                </Form>
              </div>
              <span className="text-white/20  w-full text-sm text-center my-3">Or</span>
              <div>
                <Button type="submit" className="bg-[#9F9FF8] w-full" onClick={form.handleSubmit(onSubmit)}><FcGoogle /> Sign In with Google</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignInPage