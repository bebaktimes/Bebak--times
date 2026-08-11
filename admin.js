const SUPABASE_URL =
  "https://drhvsfuvifnhdtxsfyai.supabase.co";

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
   LOGIN CHECK
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
        email,
        password
      });

    if (error) {

      $("loginMsg").textContent =
        "लॉगिन असफल: " + error.message;

      return;
    }

    $("loginMsg").textContent = "";

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
   IMAGE PREVIEW
========================= */

$("imageFile")
  .addEventListener("change", () => {

    const file =
      $("imageFile").files[0];

    const preview =
      $("imagePreview");

    preview.innerHTML = "";

    if (!file) {
      return;
    }

    const url =
      URL.createObjectURL(file);

    preview.innerHTML = `

      <img
        src="${url}"
        alt="Preview"
        style="
          max-width:100%;
          max-height:260px;
          border-radius:8px;
          margin-top:10px;
        "
      >

    `;

  });



/* =========================
   UPLOAD IMAGE
========================= */

async function uploadImage(file) {

  if (!file) {
    return null;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];


  if (!allowedTypes.includes(file.type)) {

    throw new Error(
      "कृपया JPG, PNG या WEBP फोटो चुनें।"
    );

  }


  /* 5 MB limit */

  if (file.size > 5 * 1024 * 1024) {

    throw new Error(
      "फोटो का आकार 5 MB से कम होना चाहिए।"
    );

  }


  const extension =
    file.name.split(".").pop().toLowerCase();


  const fileName =
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .substring(2, 10) +
    "." +
    extension;


  const filePath =
    fileName;


  const {
    error: uploadError
  } =
    await db.storage
      .from("news-images")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false
        }
      );


  if (uploadError) {

    throw uploadError;

  }


  const {
    data
  } =
    db.storage
      .from("news-images")
      .getPublicUrl(filePath);


  return data.publicUrl;

}



/* =========================
   PUBLISH NEWS
========================= */

$("newsForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();


    const msg =
      $("formMsg");

    msg.textContent =
      "खबर तैयार हो रही है...";


    try {

      const {
        data: { session }
      } =
        await db.auth.getSession();


      if (!session) {

        throw new Error(
          "पहले Admin Login करें।"
        );

      }


      const file =
        $("imageFile").files[0];


      let imageUrl = null;


      /* PHOTO UPLOAD */

      if (file) {

        msg.textContent =
          "📸 फोटो Upload हो रही है...";

        imageUrl =
          await uploadImage(file);

      }


      /* NEWS DATA */

      const row = {

        title:
          $("title").value.trim(),

        category:
          $("category").value,

        content:
          $("content").value.trim(),

        image_url:
          imageUrl,

        is_breaking:
          $("is_breaking").checked,

        published:
          $("published").checked

      };


      msg.textContent =
        "📰 खबर Publish हो रही है...";


      const {
        error
      } =
        await db
          .from("news")
          .insert(row);


      if (error) {

        throw error;

      }


      msg.textContent =
        "✅ खबर और फोटो सफलतापूर्वक प्रकाशित हो गई।";


      $("newsForm").reset();

      $("published").checked = true;

      $("imagePreview").innerHTML = "";


      loadAdminNews();


    } catch (error) {

      console.error(error);

      msg.textContent =
        "❌ Error: " +
        error.message;

    }

  });



/* =========================
   LOAD NEWS
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
      "<p>खबरें लोड नहीं हो सकीं: " +
      esc(error.message) +
      "</p>";

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

        ${
          news.image_url
            ? `
              <img
                src="${esc(news.image_url)}"
                alt=""
                style="
                  width:100%;
                  max-height:220px;
                  object-fit:cover;
                  border-radius:8px;
                "
              >
            `
            : ""
        }

        <small>

          ${esc(news.category)}
          •
          ${
            news.published
              ? "Published"
              : "Draft"
          }

        </small>


        <h3>
          ${esc(news.title)}
        </h3>


        <p>
          ${esc(news.content).slice(0, 250)}
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
      "Delete failed: " +
      error.message
    );

    return;
  }


  loadAdminNews();

}



/* =========================
   START
========================= */

init();
