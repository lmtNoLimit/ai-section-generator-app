import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { authenticate } from "../shopify.server";

/**
 * Legacy history route - redirects to new generations page
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  // Redirect to new generations page, preserving search params
  const url = new URL(request.url);
  const newUrl = new URL("/app/generations", url.origin);

  // Copy over relevant search params
  const page = url.searchParams.get("page");
  const status = url.searchParams.get("status");
  const favorites = url.searchParams.get("favorites");

  if (page) newUrl.searchParams.set("page", page);
  if (status) newUrl.searchParams.set("status", status);
  if (favorites) newUrl.searchParams.set("favorites", favorites);

  return redirect(newUrl.pathname + newUrl.search);
}

// Component is never rendered since loader always redirects
export default function HistoryRedirect() {
  return null;
}
