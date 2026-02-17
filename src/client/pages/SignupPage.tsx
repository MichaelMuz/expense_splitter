import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema } from '@/shared/schemas/auth';
import { z } from 'zod';

const signupFormSchema = signupSchema.extend({
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, { message: "Passwords must match", path: ["confirmPassword"] });
type SignupForm = z.infer<typeof signupFormSchema>;

export default function SignupPage() {
  const { signupMutation } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupFormSchema)
  })
  const navigate = useNavigate();

  const onSubmit = (data: SignupForm) => {
    const { confirmPassword, ...signupData } = data;
    signupMutation.mutate(signupData, { onSuccess: () => navigate('/groups') });
  };

  return (
    <Layout>
      <h1>Sign Up</h1>
      {signupMutation.isError && <p>{signupMutation.error.message}</p>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Email
            <input type="email" {...register("email")} />
            {errors.email && <p>{errors.email.message}</p>}
          </label>
        </div>
        <div>
          <label>Password
            <input type="password" {...register("password")} />
            {errors.password && <p>{errors.password.message}</p>}
          </label>
        </div>
        <div>
          <label>Confirm Password
            <input type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
          </label>
        </div>
        <button type="submit" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </Layout>
  );
}
