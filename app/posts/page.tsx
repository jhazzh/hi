import Link from "next/link";
import { sanityClient, urlFor } from "../../sanityClient";

// GROQ: every "post" doc, newest first
const QUERY = `*[_type == "post"] | order(_createdAt desc){
  _id, title, "slug": slug.current, image
}`;

type PostCard = { _id: string; title: string; slug: string; image?: unknown };

// Fetched once at build time (static export).
export default async function PostsPage() {
  const posts = await sanityClient.fetch<PostCard[]>(QUERY);

  return (
    <>
      <h1>Posts</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((post) => (
        <article
          key={post._id}
          style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}
        >
          {post.image ? (
            <Link href={`/posts/${post.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlFor(post.image).width(240).height(160).fit("crop").auto("format").url()}
                alt={post.title}
                style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 8, display: "block" }}
              />
            </Link>
          ) : null}
          <h2 style={{ margin: 0 }}>
            <Link href={`/posts/${post.slug}`}>{post.title}</Link>
          </h2>
        </article>
      ))}
    </>
  );
}
