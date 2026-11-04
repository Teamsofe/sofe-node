// Runs in <head> before first paint. Decides whether the intro plays this session,
// so returning visitors never see a flash of the overlay.
//
// - Only on the home page ("/"). Change the pathname check if your home route differs (e.g. "/en").
// - Skipped if already seen this session (sessionStorage) or if the visitor prefers reduced motion.
// - The 8s failsafe un-hides the page if JavaScript ever fails to start the animation.
export const SOFE_INTRO_HEAD_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname!=='/')return;if(sessionStorage.getItem('sofe_node_intro_seen'))return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.setAttribute('data-sofe-intro','pending');window.__sofeIntroFailsafe=setTimeout(function(){d.removeAttribute('data-sofe-intro')},8000)}catch(e){}})();`
