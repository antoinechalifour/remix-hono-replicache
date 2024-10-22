declare module "@remix-run/server-runtime" {
  export interface AppLoadContext {
    test: string;
    user: {
      id: string;
      name: string;
    };
  }
}
