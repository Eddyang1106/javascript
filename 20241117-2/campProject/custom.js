onload = () => {
    var grid = document.querySelector("#lokiPark article.row");
    var msnry = new Masonry(grid, { percentPosition: "true" });


    // cookie 設定
    // 1. 取得cookieAry,ary value ex: cookieUsed=agree
    const
        aryCookie = document.cookie.split("; "),
        nodeCookie = document.querySelector("#lokiCookie"),
        keywordCookie = "cookieUsed=agree";

    //2. 檢查 cookieAry 是否有關鍵字
    if (aryCookie.oncludes(keywordCookie)) {

    } else {
        nodeCookie.style.display = "block";
        nodeCookie.querySelector("button").onclick = () => {
            document.cookie = `${keywordCookie}; max-age=${24 * 60 * 60 * 180}`;
            nodeCookie.remove();
        }
    };






}