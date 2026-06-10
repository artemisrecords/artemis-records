import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Reçoit la requête signée du navigateur (`upload()` côté client), restreint le
// chemin et les types autorisés, renvoie un token d'upload direct vers Blob.
// Session obligatoire : admin/superadmin uploadent partout, un compte artiste
// uniquement sous `artists/<sa-fiche>/`.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const { role, artistId } = session.user;

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (role === "artiste") {
          if (!artistId || !pathname.startsWith(`artists/${artistId}/`)) {
            throw new Error("Chemin d'upload non autorisé.");
          }
        } else if (!pathname.startsWith("artists/") && !pathname.startsWith("news/")) {
          throw new Error("Chemin d'upload non autorisé.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // L'URL est persistée côté client via l'action saveMedia ; rien à faire ici.
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
