
!function () {  //使用IIFE防止汙染全域變數

    //初始工作
    const init = () => {
        const lightBoxNode = document.querySelector("#lokiLightBox");
        const mainZoeNode = lightBoxNode.querySelector(".mainZone");
        const controlNode = lightBoxNode.querySelector(".control");



        document.querySelectorAll("#lokiPark .col").forEach((colNode) => {
            //找小圖並複製他成為新的node，塞到燈箱control區
            const newMinImgNode = colNode.querySelector("img").cloneNode();
            newMinImgNode.dataset.label = colNode.querySelector("h5").textContent;

            // 順便幫minImg綁click
            newMinImgNode.addEventListener("click", (e) => {
                mainZoeNode.querySelector("img").src = newMinImgNode.src;
                mainZoeNode.querySelector("p").textContent = newMinImgNode.dataset.label;
            });
            controlNode.append(newMinImgNode);

            //規劃 每個col事件click 打開燈箱
            colNode.addEventListener("click", () => {
                //偷換好主圖和文字後，再打開燈箱

                // method 1:想辦法把當下col內的img跟string傳到mainZoeNode替換
                // mainZoeNode.querySelector("img").src = colNode.querySelector("img").src;
                // mainZoeNode.querySelector("p").textContent = colNode.querySelector("h5").textContent;

                //method 2: 把minImgNode的click事件觸發
                newMinImgNode.click();



                //打開燈箱
                lightBoxNode.classList.add("active");
            });
        });


        //燈箱的黑色背景指定 click 對自己做關閉
        //method 1
        // lightBoxNode.addEventListener("click", () => {
        //     lightBoxNode.classList.remove("active");
        // });

        //method 2
        // lightBoxNode.addEventListener("click", (e) => {
        //     e.target === lightBoxNode.classList.reomve("active");
        // });

        //method 3

        lightBoxNode.querySelector(".backdrop").addEventListener("click", function () {
            this.parentNode.classList.remove("active");
        });

        //---------------------------------------------


    };

    //初始執行區
    init();
}();

