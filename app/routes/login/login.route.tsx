export default function LoginRoute() {
  return (
    <form method="post" action="/login">
      <input name="email" type="email" placeholder="Login as..." />

      <button>Login</button>
    </form>
  );
}
