import { GenericRequestNoAuth } from "@/utils/request";
import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        wallet: { label: "Wallet", type: "text", placeholder: "jsmith" },
        signature: { label: "Signature", type: "text", placeholder: "jsmith" },
        nonce: { label: "Nonce", type: "text", placeholder: "jsmith" },
      },
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied

        if (!credentials) return null;

        const user = await fetch(
          `${process.env.NEXT_PUBLIC_BACKENDURL}/user/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              wallet: credentials.wallet,
              signature: JSON.parse(credentials.signature),
              nonce: credentials.nonce,
            }),
          }
        )
          .then((res) => res.json())
          .then((data) => {
            return data;
          })
          .catch((err) => {
            return null;
          });

        if (user) {
          // Any object returned will be saved in `user` property of the JWT
          return { token: user.token, ...user.user };
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;

          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        return { ...token, ...session };
      }
      if (user) {
        return { ...token, ...user };
      }
      return token;
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      return {
        ...session,
        user: {
          ...session.user,
          ...token,
        },
      };
    },
  },
  pages: {
    signIn: "/dashboard",
    signOut: "/dashboard",
    error: "/dashboard", // Error code passed in query string as ?error=
    //verifyRequest: "/auth/verify-request", // (used for check email message)
    //newUser: null, // If set, new users will be directed here on first sign in
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
