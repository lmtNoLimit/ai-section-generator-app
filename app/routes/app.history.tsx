import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useActionData, useLoaderData, useSearchParams, useSubmit, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { historyService } from "../services/history.server";
import { HistoryTable } from "../components/history/HistoryTable";
import { HistoryPreviewModal } from "../components/history/HistoryPreviewModal";
import { FilterButtonGroup } from "../components/shared/FilterButtonGroup";
import { EmptyState } from "../components/shared/EmptyState";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const status = url.searchParams.get("status") || undefined;
  const favoritesOnly = url.searchParams.get("favorites") === "true";

  const history = await historyService.getByShop(shop, {
    page,
    limit: 20,
    status,
    favoritesOnly,
  });

  return { history };
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "toggleFavorite") {
    const id = formData.get("id") as string;
    await historyService.toggleFavorite(id, shop);
    return { success: true, action: "toggleFavorite" };
  }

  if (actionType === "delete") {
    const id = formData.get("id") as string;
    await historyService.delete(id, shop);
    return { success: true, action: "delete" };
  }

  return null;
}

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "generated", label: "Generated" },
  { value: "saved", label: "Saved" },
  { value: "favorites", label: "Favorites" },
];

export default function HistoryPage() {
  const { history } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [previewItem, setPreviewItem] = useState<typeof history.items[0] | null>(null);

  const currentStatus = searchParams.get("status") || "";
  const favoritesOnly = searchParams.get("favorites") === "true";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Determine current filter value
  const currentFilterValue = favoritesOnly ? "favorites" : currentStatus;

  const handleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams);

    if (value === "favorites") {
      params.delete("status");
      params.set("favorites", "true");
    } else {
      params.delete("favorites");
      if (value) {
        params.set("status", value);
      } else {
        params.delete("status");
      }
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handleToggleFavorite = (id: string) => {
    const formData = new FormData();
    formData.append("action", "toggleFavorite");
    formData.append("id", id);
    submit(formData, { method: "post" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this history entry?")) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", id);
      submit(formData, { method: "post" });
    }
  };

  return (
    <>
      <s-page heading="Generation History" inlineSize="large">
        <s-stack gap="large" direction="block">
          {/* Banners */}
          {actionData?.action === "delete" && (
            <s-banner tone="success" dismissible>
              Entry deleted successfully.
            </s-banner>
          )}

          <s-section padding="none" accessibilityLabel="History table">
            {/* Filters */}
            <s-box padding="base">
              <FilterButtonGroup
                options={FILTER_OPTIONS}
                value={currentFilterValue}
                onChange={handleFilterChange}
              />
            </s-box>

            {/* Table or Empty State */}
            {history.items.length > 0 ? (
              <HistoryTable
                items={history.items}
                onPreview={setPreviewItem}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
              />
            ) : (
              <s-box padding="large">
                <EmptyState
                  heading="No history entries"
                  description="Generate some sections to see them here."
                  primaryAction={{
                    label: "Generate Section",
                    onClick: () => navigate("/app/generate")
                  }}
                />
              </s-box>
            )}

            {/* Pagination */}
            {history.totalPages > 1 && (
              <s-box padding="base">
                <s-stack gap="small" direction="inline" justifyContent="center" alignItems="center">
                  <s-button-group>
                    <s-button
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </s-button>
                    <s-button
                      disabled={currentPage >= history.totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </s-button>
                  </s-button-group>
                  <s-text color="subdued">
                    Page {history.page} of {history.totalPages}
                  </s-text>
                </s-stack>
              </s-box>
            )}
          </s-section>
        </s-stack>
      </s-page>

      {/* Preview Modal */}
      {previewItem && (
        <HistoryPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </>
  );
}
