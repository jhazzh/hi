import { sanityClient } from "../../sanityClient";

// Sun + planets (ordered), each with its moons pulled via back-reference.
const QUERY = `{
  "sun": *[_type == "star"][0]{name, diameterKm, coreTempC, ageBillionYears},
  "planets": *[_type == "planet"] | order(order asc){
    _id, name, order, diameterKm, distanceFromSunKm,
    "moons": *[_type == "moon" && orbits._ref == ^._id] | order(diameterKm desc){
      _id, name, diameterKm
    }
  }
}`;

type Moon = { _id: string; name: string; diameterKm?: number };
type Planet = {
  _id: string; name: string; order: number;
  diameterKm?: number; distanceFromSunKm?: number; moons: Moon[];
};
type Sun = { name: string; diameterKm?: number; coreTempC?: number; ageBillionYears?: number };
type SolarSystem = { sun: Sun | null; planets: Planet[] };

const num = (n?: number | null) => (n == null ? "—" : n.toLocaleString());

// Fetched once at build time (static export) — content lands in the HTML for SEO.
export default async function PlanetsPage() {
  const data = await sanityClient.fetch<SolarSystem>(QUERY);

  return (
    <>
      <h1>The Solar System</h1>
      {!data && <p>Nothing found.</p>}

      {data?.sun && (
        <section style={{ marginBottom: 32 }}>
          <h2>☀️ {data.sun.name}</h2>
          <p>
            Diameter {num(data.sun.diameterKm)} km · Core {num(data.sun.coreTempC)} °C ·{" "}
            {data.sun.ageBillionYears} billion years old
          </p>
        </section>
      )}

      {data?.planets.map((p) => (
        <section key={p._id} style={{ marginBottom: 24 }}>
          <h3>
            {p.order}. {p.name}
          </h3>
          <p style={{ margin: "4px 0", opacity: 0.8 }}>
            Diameter {num(p.diameterKm)} km · {num(p.distanceFromSunKm)} km from Sun
          </p>
          {p.moons.length > 0 ? (
            <ul style={{ margin: "4px 0" }}>
              {p.moons.map((m) => (
                <li key={m._id}>
                  {m.name} ({num(m.diameterKm)} km)
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: "4px 0", fontStyle: "italic", opacity: 0.6 }}>No moons</p>
          )}
        </section>
      ))}
    </>
  );
}
