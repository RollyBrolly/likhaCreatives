/* Likha Creatives — interactions */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var nav = document.getElementById("primary-nav");
  var toggle = document.getElementById("navToggle");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.classList.toggle("active", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Header shadow on scroll ---------- */
  var header = document.getElementById("top");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Portfolio filtering ---------- */
  var filters = document.querySelectorAll(".filter-btn");
  var items = Array.prototype.slice.call(document.querySelectorAll(".portfolio-item"));

  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      var f = btn.getAttribute("data-filter");
      items.forEach(function (item) {
        var show = f === "all" || item.getAttribute("data-category") === f;
        item.classList.toggle("hide", !show);
      });
    });
  });

  /* ---------- Portfolio lightbox (per-project media slideshow) ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbMedia = document.getElementById("lbMedia");
  var lbTitle = document.getElementById("lbTitle");
  var lbMeta = document.getElementById("lbMeta");
  var lbCounter = document.getElementById("lbCounter");
  var lbDots = document.getElementById("lbDots");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var lbLinks = document.getElementById("lbLinks");
  var lbLinkList = document.getElementById("lbLinkList");
  var lbCloseEls = document.querySelectorAll("[data-lb-close]");
  var lastFocused = null;

  var mediaList = []; /* media sources for the currently open project */
  var mediaIndex = 0;
  var currentItem = null;
  var linkList = []; /* video links for the currently open project */
  var linksMode = false; /* true when the open project shows links, not media */

  var VIDEO_RE = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;
  function isVideo(src) { return VIDEO_RE.test(src); }

  /* Collect one project's media, in priority order:
     1) data-media list  2) .thumb-collage images
     3) data-video       4) data-src        5) empty (placeholder) */
  function getMediaList(item) {
    var list = [];
    var dm = item.getAttribute("data-media");
    if (dm) {
      dm.split(",").forEach(function (s) {
        s = s.trim();
        if (s) list.push(s);
      });
    }
    if (!list.length) {
      var collage = item.querySelectorAll(".thumb-collage img");
      Array.prototype.forEach.call(collage, function (img) {
        var s = img.getAttribute("src");
        if (s) list.push(s);
      });
    }
    if (!list.length) {
      var v = item.getAttribute("data-video");
      if (v) list.push(v);
    }
    if (!list.length) {
      var one = item.getAttribute("data-src");
      if (one) list.push(one);
    }
    return list;
  }

  /* Parse data-links into [{label, url}] pairs.
     Format:  "Label | URL ;; Label | URL"
     The "|" splits label from URL; ";;" separates entries (so commas in
     URLs are safe). Falls back to using the whole entry as the URL. */
  function getLinks(item) {
    var raw = item.getAttribute("data-links");
    if (!raw) return [];
    return raw.split(";;").map(function (entry) {
      entry = entry.trim();
      if (!entry) return null;
      var label, url;
      var bar = entry.indexOf("|");
      if (bar !== -1) {
        label = entry.slice(0, bar).trim();
        url = entry.slice(bar + 1).trim();
      } else {
        url = entry;
      }
      if (!url) return null;
      return { label: label || url, url: url };
    }).filter(Boolean);
  }

  /* Pretty host label for a URL (e.g. "youtube.com") */
  function hostOf(url) {
    var m = String(url).match(/^https?:\/\/([^\/?#]+)/i);
    return m ? m[1].replace(/^www\./, "") : url;
  }

  /* Build an in-card media viewer for every project:
       - 0 media  -> gradient + emoji placeholder (left untouched)
       - 1 image  -> single cover image
       - 2+ media -> auto-cycling slider (pauses on hover, dot indicators) */
  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  items.forEach(function (item) {
    var thumb = item.querySelector(".thumb");
    if (!thumb) return;

    var list = getMediaList(item);
    if (!list.length) return; /* keep the styled placeholder */

    var emoji = item.querySelector(".thumb-emoji");

    /* Single image -> simple cover */
    if (list.length === 1 && !isVideo(list[0])) {
      var cover = document.createElement("img");
      cover.src = list[0];
      cover.alt = "";
      cover.className = "thumb-single";
      thumb.insertBefore(cover, thumb.firstChild);
      if (emoji) emoji.style.display = "none";
      return;
    }

    /* Multiple media -> sliding carousel */
    var slider = document.createElement("div");
    slider.className = "thumb-slider";
    slider.setAttribute("aria-hidden", "true");

    var track = document.createElement("div");
    track.className = "thumb-track";

    list.forEach(function (src) {
      var slide = document.createElement("div");
      slide.className = "thumb-slide";
      if (isVideo(src)) {
        var v = document.createElement("video");
        v.src = src;
        v.muted = true;
        v.loop = true;
        v.autoplay = true;
        v.setAttribute("playsinline", "");
        v.setAttribute("muted", "");
        slide.appendChild(v);
      } else {
        var img = document.createElement("img");
        img.src = src;
        img.alt = "";
        slide.appendChild(img);
      }
      track.appendChild(slide);
    });
    slider.appendChild(track);

    var dots = document.createElement("div");
    dots.className = "thumb-dots";
    list.forEach(function (_, i) {
      var d = document.createElement("span");
      d.className = "thumb-dot" + (i === 0 ? " active" : "");
      dots.appendChild(d);
    });
    slider.appendChild(dots);

    thumb.insertBefore(slider, thumb.firstChild);
    if (emoji) emoji.style.display = "none";

    /* Cycling (skipped when the user prefers reduced motion) */
    var index = 0;
    var timer = null;
    function go(i) {
      index = (i + list.length) % list.length;
      track.style.transform = "translateX(" + (-index * 100) + "%)";
      for (var k = 0; k < dots.children.length; k++) {
        dots.children[k].classList.toggle("active", k === index);
      }
    }
    function start() {
      stop();
      if (reduceMotion) return;
      timer = window.setInterval(function () { go(index + 1); }, 2800);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    start();
    item.addEventListener("mouseenter", stop);
    item.addEventListener("mouseleave", start);
  });

  function buildPlaceholder(item) {
    var gradClass = "";
    var thumb = item.querySelector(".thumb");
    if (thumb) {
      Array.prototype.forEach.call(thumb.classList, function (c) {
        if (c.indexOf("thumb-") === 0 &&
            c !== "thumb-emoji" && c !== "thumb-tag" && c !== "thumb-zoom") {
          gradClass = c;
        }
      });
    }
    var emojiEl = item.querySelector(".thumb-emoji");
    var ph = document.createElement("div");
    ph.className = ("lb-placeholder " + gradClass).trim();
    var emoji = document.createElement("span");
    emoji.className = "thumb-emoji";
    emoji.setAttribute("aria-hidden", "true");
    emoji.textContent = emojiEl ? emojiEl.textContent : "🖼️";
    ph.appendChild(emoji);
    var note = document.createElement("span");
    note.className = "lb-placeholder-note";
    note.textContent = "Add media via data-media / data-src / data-video";
    ph.appendChild(note);
    return ph;
  }

  /* Size the open media to the viewport while preserving its REAL aspect
     ratio, so the modal hugs a portrait, a wide banner, etc. Reads the
     loaded image/video intrinsic dimensions and applies a fitted box. */
  function fitMedia() {
    var el = lbMedia.querySelector("img, video");
    if (!el) return;

    function apply(natW, natH) {
      if (!natW || !natH) return;
      var frame = lbMedia.closest(".lb-frame");
      var stage = frame ? frame.parentElement : null;
      var caption = stage ? stage.querySelector(".lb-caption") : null;
      var captionH = caption ? caption.offsetHeight : 92;
      /* Available box: leave room for the viewport padding + caption bar */
      var availW = Math.max(280, Math.min(window.innerWidth * 0.92, 1000));
      var availH = Math.max(240, window.innerHeight * 0.88 - captionH - 40);
      /* Never upscale beyond natural size -> images stay crisp */
      var scale = Math.min(availW / natW, availH / natH, 1);
      el.style.width = Math.floor(natW * scale) + "px";
      el.style.height = Math.floor(natH * scale) + "px";
    }

    if (el.tagName === "VIDEO") {
      if (el.videoWidth) apply(el.videoWidth, el.videoHeight);
      else el.addEventListener("loadedmetadata", function () {
        apply(el.videoWidth, el.videoHeight);
      }, { once: true });
    } else {
      if (el.complete && el.naturalWidth) apply(el.naturalWidth, el.naturalHeight);
      else el.addEventListener("load", function () {
        apply(el.naturalWidth, el.naturalHeight);
      }, { once: true });
    }
  }

  function renderMedia() {
    lbMedia.innerHTML = "";
    if (!mediaList.length) {
      lbMedia.appendChild(buildPlaceholder(currentItem));
      return;
    }
    var src = mediaList[mediaIndex];
    if (isVideo(src)) {
      var v = document.createElement("video");
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.muted = true;
      v.loop = true;
      v.setAttribute("playsinline", "");
      lbMedia.appendChild(v);
    } else {
      var img = document.createElement("img");
      img.src = src;
      img.alt = currentItem.getAttribute("data-title") || "Portfolio image";
      lbMedia.appendChild(img);
    }
    fitMedia();
  }

  /* Build the video-link list panel for the OPEN project */
  function renderLinks() {
    if (!lbLinkList) return;
    lbLinkList.innerHTML = "";
    linkList.forEach(function (link) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "lb-link";
      a.href = link.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      var icon = document.createElement("span");
      icon.className = "lb-link-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

      var text = document.createElement("span");
      text.className = "lb-link-text";
      var label = document.createElement("span");
      label.className = "lb-link-label";
      label.textContent = link.label;
      var host = document.createElement("span");
      host.className = "lb-link-host";
      host.textContent = hostOf(link.url);
      text.appendChild(label);
      text.appendChild(host);

      var arrow = document.createElement("span");
      arrow.className = "lb-link-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";

      a.appendChild(icon);
      a.appendChild(text);
      a.appendChild(arrow);
      li.appendChild(a);
      lbLinkList.appendChild(li);
    });
  }

  /* Render the current slide + caption + dots for the OPEN project */
  function renderSlide() {
    lbTitle.textContent = currentItem.getAttribute("data-title") || "Untitled";
    lbMeta.textContent = currentItem.getAttribute("data-meta") || "";

    /* --- Links mode: show the link list instead of media --- */
    if (linksMode) {
      if (lbMedia) lbMedia.style.display = "none";
      if (lbLinks) lbLinks.hidden = false;
      if (lbPrev) lbPrev.style.visibility = "hidden";
      if (lbNext) lbNext.style.visibility = "hidden";
      if (lbDots) lbDots.style.display = "none";
      lbCounter.textContent = linkList.length ? linkList.length + " link" + (linkList.length > 1 ? "s" : "") : "";
      renderLinks();
      return;
    }

    /* --- Media mode (default) --- */
    if (lbLinks) lbLinks.hidden = true;
    if (lbMedia) lbMedia.style.display = "";
    renderMedia();

    var total = mediaList.length;
    var multi = total > 1;

    /* Counter + arrows only make sense with more than one media item */
    lbCounter.textContent = total ? (mediaIndex + 1) + " / " + total : "";
    if (lbPrev) lbPrev.style.visibility = multi ? "visible" : "hidden";
    if (lbNext) lbNext.style.visibility = multi ? "visible" : "hidden";

    /* Dot indicators (one per media item) */
    if (lbDots) {
      lbDots.innerHTML = "";
      lbDots.style.display = multi ? "flex" : "none";
      for (var i = 0; i < total; i++) {
        (function (i) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className = "lb-dot" + (i === mediaIndex ? " active" : "");
          dot.setAttribute("aria-label", "Go to item " + (i + 1));
          dot.addEventListener("click", function () { goTo(i); });
          lbDots.appendChild(dot);
        })(i);
      }
    }
  }

  /* Move to a media index within the CURRENT project (wraps around) */
  function goTo(index) {
    if (!mediaList.length) return;
    mediaIndex = (index + mediaList.length) % mediaList.length;
    renderSlide();
  }

  function openLightbox(item) {
    lastFocused = document.activeElement;
    currentItem = item;
    linkList = getLinks(item);
    linksMode = linkList.length > 0;
    mediaList = getMediaList(item);
    mediaIndex = 0;
    lightbox.hidden = false;
    document.body.classList.add("lb-open");
    void lightbox.offsetWidth; /* reflow so the transition plays */
    lightbox.classList.add("open");
    renderSlide();
    /* Focus the first link in links mode, else the next arrow */
    if (linksMode) {
      var firstLink = lbLinkList ? lbLinkList.querySelector(".lb-link") : null;
      if (firstLink) firstLink.focus();
    } else if (lbNext && lbNext.style.visibility !== "hidden") {
      lbNext.focus();
    } else if (lbPrev) {
      lbPrev.focus();
    }
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    document.body.classList.remove("lb-open");
    var v = lbMedia.querySelector("video");
    if (v) { try { v.pause(); } catch (e) {} }
    window.setTimeout(function () {
      lightbox.hidden = true;
      lbMedia.innerHTML = "";
      if (lbLinkList) lbLinkList.innerHTML = "";
    }, 250);
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  if (lightbox) {
    items.forEach(function (item) {
      var trigger = item.querySelector(".pf-trigger");
      if (trigger) trigger.addEventListener("click", function () { openLightbox(item); });
    });

    if (lbPrev) lbPrev.addEventListener("click", function () { goTo(mediaIndex - 1); });
    if (lbNext) lbNext.addEventListener("click", function () { goTo(mediaIndex + 1); });
    lbCloseEls.forEach(function (el) { el.addEventListener("click", closeLightbox); });

    /* Re-fit the open media when the viewport changes */
    window.addEventListener("resize", function () {
      if (!lightbox.hidden) fitMedia();
    });

    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        goTo(mediaIndex - 1);
      } else if (e.key === "ArrowRight") {
        goTo(mediaIndex + 1);
      }
    });

    /* Simple focus trap so keyboard users stay inside the modal */
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden || e.key !== "Tab") return;
      var focusables = lightbox.querySelectorAll("button, [href], video[controls]");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Contact form ----------
     Submissions are delivered to the studio inbox via EmailJS (no
     backend required, free tier). All configuration lives in ONE
     place: the three data-emailjs-* attributes on the form in
     index.html — Public Key, Service ID and Template ID from your
     EmailJS dashboard. The email template should use {{subject}} as
     its Subject and {{email}} as Reply-To; every variable it can
     print is listed in README.md. Until the keys are pasted in
     (values still starting with "YOUR_"), submits show a friendly
     "not connected yet" message pointing at the studio's direct
     email instead of failing silently. */
  var form = document.getElementById("contactForm");
  if (form) {
    function studioEmail() {
      var mailLink = document.querySelector('a[href^="mailto:"]');
      return mailLink ? mailLink.getAttribute("href").replace("mailto:", "") : "hello@likhacreatives.com";
    }

    function isPlaceholder(v) {
      return !v || v.toUpperCase().indexOf("YOUR_") === 0;
    }

    /* Re-read on every submit so the form's data attributes stay the
       single source of truth. */
    function emailjsConfig() {
      return {
        publicKey: form.getAttribute("data-emailjs-public-key") || "",
        serviceId: form.getAttribute("data-emailjs-service") || "",
        templateId: form.getAttribute("data-emailjs-template") || ""
      };
    }

    /* One-time SDK setup, as soon as the key is real. */
    var initialCfg = emailjsConfig();
    if (window.emailjs && !isPlaceholder(initialCfg.publicKey)) {
      window.emailjs.init({ publicKey: initialCfg.publicKey });
    }

    var bundleField = document.getElementById("bundleField");
    var bundleSel = document.getElementById("bundle");
    var bundleHint = document.getElementById("bundleHint");
    var serviceField = document.getElementById("serviceField");
    var serviceSel = document.getElementById("serviceItem");
    var qtyField = document.getElementById("qtyField");
    var qtyInput = document.getElementById("qty");
    var priceValue = document.getElementById("priceValue");

    function peso(n) {
      return "\u20B1" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function selectedType() {
      var checked = form.querySelector("input[name='projectType']:checked");
      return checked ? checked.value : "bundle";
    }

    function updateEstimate() {
      var type = selectedType();
      var showBundle = type === "bundle";
      var showService = type === "standalone";
      if (bundleField) bundleField.hidden = !showBundle;
      if (serviceField) serviceField.hidden = !showService;
      if (qtyField) qtyField.hidden = !showService;
      if (!priceValue) return;

      if (showBundle) {
        var bOpt = bundleSel.options[bundleSel.selectedIndex];
        if (bundleHint) bundleHint.textContent = bOpt.getAttribute("data-summary") || "";
        priceValue.textContent = peso(Number(bOpt.getAttribute("data-price")) || 0);
      } else if (showService) {
        var sOpt = serviceSel.options[serviceSel.selectedIndex];
        var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        priceValue.textContent = peso((Number(sOpt.getAttribute("data-price")) || 0) * qty);
      } else {
        if (bundleHint) bundleHint.textContent = "";
        priceValue.textContent = "Custom quote";
      }
    }

    var typeInputs = form.querySelectorAll("input[name='projectType']");
    for (var t = 0; t < typeInputs.length; t++) {
      typeInputs[t].addEventListener("change", updateEstimate);
    }
    if (bundleSel) bundleSel.addEventListener("change", updateEstimate);
    if (serviceSel) serviceSel.addEventListener("change", updateEstimate);
    if (qtyInput) qtyInput.addEventListener("input", updateEstimate);
    updateEstimate();

    /* "Choose ..." buttons on the package cards pre-fill the form */
    var pickBtns = document.querySelectorAll("[data-package]");
    for (var b = 0; b < pickBtns.length; b++) {
      pickBtns[b].addEventListener("click", function () {
        var radio = form.querySelector("input[name='projectType'][value='bundle']");
        if (radio) radio.checked = true;
        if (bundleSel) bundleSel.value = this.getAttribute("data-package");
        updateEstimate();
      });
    }

    var sending = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      var status = document.getElementById("formStatus");
      var name = (document.getElementById("name") || {}).value || "";
      var email = (document.getElementById("email") || {}).value || "";
      if (!name.trim() || !email.trim() || email.indexOf("@") < 0) {
        if (status) {
          status.textContent = "Please add your name and a valid email so we can reply.";
          status.classList.add("show", "error");
        }
        return;
      }

      /* Honeypot: hidden from real visitors — if it has a value, a bot
         is submitting, so pretend success and send nothing. */
      var honeypot = document.getElementById("honeypot");
      if (honeypot && honeypot.value) {
        if (status) {
          status.textContent = "Thanks! We received your request \u2014 we'll reply within 24 hours.";
          status.classList.remove("error");
          status.classList.add("show");
        }
        form.reset();
        updateEstimate();
        return;
      }

      /* Unconfigured keys or a blocked CDN — don't fail silently. */
      var cfg = emailjsConfig();
      if (!window.emailjs || isPlaceholder(cfg.publicKey) ||
          isPlaceholder(cfg.serviceId) || isPlaceholder(cfg.templateId)) {
        if (status) {
          status.textContent = "This form isn't connected yet \u2014 please email us directly at " + studioEmail() + ".";
          status.classList.add("show", "error");
        }
        return;
      }

      /* Friendly confirmation, built before the form resets */
      var type = selectedType();
      var summary = "";
      var projectLabel = "";
      var selection = "";
      var qtyParam = "";
      if (type === "bundle" && bundleSel) {
        selection = bundleSel.options[bundleSel.selectedIndex].text;
        projectLabel = "Bundle package";
        summary = " for the " + selection;
      } else if (type === "standalone" && serviceSel) {
        var qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        selection = qty + "\u00D7 " + serviceSel.options[serviceSel.selectedIndex].text;
        projectLabel = "Standalone service";
        qtyParam = String(qty);
        summary = " for " + selection;
      } else {
        projectLabel = "Custom project";
        selection = "Custom \u2014 needs a custom quote";
        summary = " for a custom project";
      }
      var estimate = priceValue ? priceValue.textContent : "";

      /* Every value the EmailJS template can print ({{name}},
         {{estimate}}, {{selection}}…) is assembled here — see README.md
         for the full list. */
      var params = {
        subject: "New project request \u2014 Likha Creatives \u2014 " + name.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: (document.getElementById("phone") || {}).value || "",
        deadline: (document.getElementById("deadline") || {}).value || "",
        project_type: projectLabel,
        selection: selection,
        qty: qtyParam,
        estimate: estimate,
        refs: (document.getElementById("refs") || {}).value || "",
        message: (document.getElementById("message") || {}).value || "",
        reply_to: email.trim(),
        page_url: location.href,
        submitted_at: new Date().toLocaleString()
      };

      var btn = form.querySelector("button[type='submit']");
      var btnLabel = btn ? btn.textContent : "";
      sending = true;
      if (btn) { btn.disabled = true; btn.textContent = "Sending\u2026"; }

      /* The public key is passed here as well as in init() so the call
         still works if the form's config attributes change after load. */
      window.emailjs.send(cfg.serviceId, cfg.templateId, params, { publicKey: cfg.publicKey })
        .then(function () {
          if (status) {
            status.textContent = "Thanks, " + name.trim() + "! We received your request" +
              summary + " (estimate: " + estimate + "). We'll reply within 24 hours.";
            status.classList.remove("error");
            status.classList.add("show");
          }
          form.reset();
          updateEstimate();
        })
        .catch(function () {
          if (status) {
            status.textContent = "Sorry \u2014 we couldn't send that just now. Please email us directly at " + studioEmail() + ".";
            status.classList.add("show", "error");
          }
        })
        .then(function () {
          sending = false;
          if (btn) { btn.disabled = false; btn.textContent = btnLabel; }
        });
    });
  }
})();
