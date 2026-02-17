import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/shared/schemas/auth';

export default function LoginPage() {
  const { loginMutation } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data, { onSuccess: () => navigate('/groups') });
  };

  return (
    <Layout>
      <h1>Login</h1>
      {loginMutation.isError && <p>{loginMutation.error.message}</p>}
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
        <button type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </Layout>
  );
}
