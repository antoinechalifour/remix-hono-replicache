import { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/react";

export const raise = (message: string) => {
  throw new Error(message);
};

export const requireUser = (args: LoaderFunctionArgs) => {
  const user = args.context.user;
  if (user == null) throw redirect("/login");
  return user;
};
