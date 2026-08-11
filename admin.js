const SUPABASE_URL = "https://drhvsfuvifnhdtxsfyai.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_2hW_8MXdWQI2ry0-mXgraQ_GQU_4xL7";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


const $ = (id) =>
  document.getElementById(id);


const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));



/* =========================
   CHECK LOGIN
========================= */

async function init() {

  const {
    data: { session }
  } = await db.auth.getSession();

  showState(session);

  if (session) {
    loadAdminNews();
  }

}



function showState(session) {

  $("loginBox")
    .classList
    .toggle("hidden", !!session);

  $("adminBox")
    .classList
    .toggle("hidden", !session);

}



/* =========================
   LOGIN
========================= */

$("loginForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    $("loginMsg").textContent =
      "लॉगिन हो रहा है...";


    const email =
      $("email").value.trim();

    const password =
      $("password").value;


    const {
      data,
      error
    } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });


    if (error) {

      $("loginMsg").textContent =
        "लॉगिन असफल: " + error.message;

      return;

    }


    $("loginMsg").textContent =
      "";


    showState(data.session);

    loadAdminNews();

  });



/* =========================
   LOGOUT
========================= */

$("logoutBtn")
  .addEventListener("click", async () => {

    await db.auth.signOut();

    showState(null);

  });



/* =========================
   PUBLISH NEWS
========================= */

$("newsForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();


    $("formMsg").textContent =
      "खबर Publish हो रही है...";


    const {
      data: { session }
    } =
      await db.auth.getSession();


    if (!session) {

      $("formMsg").textContent =
        "पहले Admin Login करें।";

      return;

    }


    const row = {

      title:
        $("title").value.trim(),

      category:
        $("category").value,

      content:
        $("content").value.trim(),

      image_url:
        $("image_url").value.trim() || null,

      is_breaking:
        $("is_breaking").checked,

      published:
        $("published").checked

    };


    const {
      error
    } =
      await db
        .from("news")
        .insert(row);


    if (error) {

      $("formMsg").textContent =
        "Error: " + error.message;

      return;

    }


    $("formMsg").textContent =
      "✅ खबर सफलतापूर्वक प्रकाशित हो गई।";


    $("newsForm").reset();


    $("published").checked =
      true;


    loadAdminNews();

  });



/* =========================
   LOAD ADMIN NEWS
========================= */

async function loadAdminNews() {

  const box =
    $("adminNews");


  const {
    data,
    error
  } =
    await db
      .from("news")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    box.innerHTML =
      "<p>खबरें लोड नहीं हो सकीं: "
      + esc(error.message)
      + "</p>";

    return;

  }


  if (!data || data.length === 0) {

    box.innerHTML =
      "<p>अभी कोई खबर नहीं है।</p>";

    return;

  }


  box.innerHTML =
    data.map((news) => `

      <article class="card">

        <small>

          ${esc(news.category)}
          •
          ${news.published
            ? "Published"
            : "Draft"}

        </small>


        <h3>
          ${esc(news.title)}
        </h3>


        <p>
          ${esc(
            news.content
          ).slice(0, 250)}
        </p>


        <button
          class="danger"
          onclick="deleteNews(${news.id})">

          Delete

        </button>

      </article>

    `).join("");

}



/* =========================
   DELETE NEWS
========================= */

async function deleteNews(id) {

  if (
    !confirm(
      "क्या आप यह खबर हटाना चाहते हैं?"
    )
  ) {

    return;

  }


  const {
    error
  } =
    await db
      .from("news")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "Delete failed: "
      + error.message
    );

    return;

  }


  loadAdminNews();

}



/* =========================
   START
========================= */

init();
