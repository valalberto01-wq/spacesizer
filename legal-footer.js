(() => {
  if (document.querySelector(".siteLegalFooter")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "legal.css?v=20260816";
  document.head.appendChild(link);
  document.body.insertAdjacentHTML("beforeend", `<footer class="siteLegalFooter"><div class="siteLegalFooterInner"><p><strong>SpaceSizer provides estimates only.</strong> Actual fit depends on item dimensions, packing, stacking, access and the exact storage unit or vehicle. Confirm suitability, availability and pricing directly with your chosen provider. SpaceSizer does not currently rank, endorse or guarantee third-party providers.</p><nav class="siteLegalLinks" aria-label="Legal and help"><a href="faq.html">FAQs</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms of Use</a><a href="cookies.html">Cookies & device storage</a><a href="mailto:info@spacesizer.co.uk">Contact</a></nav><p class="siteLegalCopy">© ${new Date().getFullYear()} SpaceSizer · info@spacesizer.co.uk</p></div></footer>`);
})();
