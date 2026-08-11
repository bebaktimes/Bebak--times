const SUPABASE_URL = "https://drhvsfuvifnhdtxsfyai.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_2hW_8MXdWQI2ry0-mXgraQ_GQU_4xL7";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

async function loadNews() {

  const list = document.getElementById("newsList");
  const breaking = document.getElementById("breakingText");

  const { data, error } = await db
    .from("news")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    list.innerHTML = "<p>खबरें लोड नहीं हो सकीं।</p>";
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = "<p>अभी कोई खबर प्रकाशित नहीं है।</p>";
    return;
  }

  const breakingNews = data.find(
    (news) => news.is_breaking === true
  );

  if (breakingNews) {
    breaking.textContent = breakingNews.title;
  }

  list.innerHTML = data.map((news) => `

    <article class="card">

      ${
        news.image_url
          ? `<img src="${esc(news.image_url)}" alt="">`
          : ""
      }

      ${
        news.is_breaking
          ? `<span class="tag">BREAKING</span>`
          : ""
      }

      <small>
        ${esc(news.category)}
        •
        ${new Date(news.created_at).toLocaleString("hi-IN")}
      </small>

      <h3>
        ${esc(news.title)}
      </h3>

      <p>
        ${esc(news.content).replace(/\n/g, "<br>")}
      </p>

    </article>

  `).join("");
}

loadNews();
