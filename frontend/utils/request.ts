import { NextResponse } from "next/server";
import { redirect, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const buildParams = (data: any) => {
  if (!data) return "";
  const params = new URLSearchParams();

  Object.entries(data).forEach(([key, value]: [string, any]) => {
    if (Array.isArray(value)) {
      value.forEach((val) => params.append(key, val.toString()));
    } else {
      params.append(key, value.toString());
    }
  });
  return params.toString();
};

interface Options {
  method: string;
  headers: {
    Accept: string;
    "Content-Type": string;
    Authorization?: string;
  };
  body?: string;
}

export interface GenericRequest {
  url: string;
  method: string;
  token: string;
  params?: any;
  data?: any;
  absolute?: boolean;
}

export const genericRequest = async ({
  url,
  method,
  token,
  params = {},
  data = {},
  absolute = false,
}: GenericRequest) => {
  const options: Options = {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  if (method.toUpperCase() !== "GET") {
    options.body = JSON.stringify(data);
  }

  try {
    const result = await fetch(
      absolute
        ? url
        : `${process.env.NEXT_PUBLIC_BACKENDURL}${url}?${buildParams(params)}`,
      options
    );

    // console.log(result.status);

    if (result.status === 500) {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard?expired=true";
      }
      // signOut();
    }

    const jsonResponse = await result.json();

    /*   if (jsonResponse.status === 500) {
      console.log("HERE");
      if (jsonResponse.message === "jwt expired") {
        signOut();
      }
    } */

    return jsonResponse;
  } catch (err: any) {
    return { status: 500, success: false, data: err.message };
  }
};

export interface GenericRequestNoAuth {
  url: string;
  method: string;
  params?: any;
  data: any;
  absolute?: boolean;
}

export const genericRequestNoAuth = async ({
  url,
  method,
  params = {},
  data,
  absolute = false,
}: GenericRequestNoAuth) => {
  let options: Options = {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  };

  if (method.toUpperCase() !== "GET") {
    options.body = JSON.stringify(data);
  }

  try {
    const result = await fetch(
      absolute
        ? url
        : `${process.env.NEXT_PUBLIC_BACKENDURL}${url}?${buildParams(params)}`,
      options
    );
    const jsonResponse = await result.json();
    return jsonResponse;
  } catch (err: any) {
    return { status: 500, success: false, data: err.message };
  }
};
