import Link from "next/link";
import { sanityClient, urlFor } from "../../../sanityClient";

const QUERY = `*[_type == "post" && slug.current == $slug][0]{
  _id, title, body, image
}`;

const SLUGS_QUERY = `*[_type == "post" && defined(slug.current)].slug.current`;

type PostDoc = { _id: string; title: string; body?: string; image?: unknown };

// Pre-render one HTML file per post slug at build time.
export async function generateStaticParams() {
  const slugs = await sanityClient.fetch<string[]>(SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  const post = await sanityClient.fetch<PostDoc | null>(QUERY, { slug });

  if (!post) return <p>Post not found.</p>;

  return (
    <>
      <Link href="/posts">← Back</Link>
      <h1>{post.title}</h1>
      {post.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={urlFor(post.image).width(2000).auto("format").url()}
          alt={post.title}
          style={{ width: "100%", height: "auto", borderRadius: 12, margin: "12px 0" }}
        />
      ) : null}
      {post.body ? <p>{post.body}</p> : null}
    </>
  );
}
