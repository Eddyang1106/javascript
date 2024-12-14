dayjs.locale('zh-tw');
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

//宣告全域變數//
let
    apiPath = './db.json',
    booked = [],
    nationholiday = [],
    pallet = {},
    myCalender = null;
tableData = { //表格資料，到時候提供tableMaker 輸出畫面，若要更新value，就對這裡修改
    totalPrice: 999, //總價格
    normalCount: 1, //平日幾晚
    holidayCount: 5, //假日幾晚
    pallet: { //營位資料 =>標題名稱 可賣數量 預約日金 小計 訂購數
        aArea: { title: '河畔 × A 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
        bArea: { title: '山間 × B 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
        cArea: { title: '平原 × C 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
        dArea: { title: '車屋 × D 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 }
    }
};




//初始化作業// 打API
const init = () => {
    ///安排工作打API
    fetch('./db.json', { method: "GET " })
        .then(res =>
            res.json()
        )
        .then(json => {
            // booked = json.booked;
            // nationholiday = json.nationholiday;
            // pallet = json.pallet;
            ({ booked, pallet, nationholiday } = json);

            const myCalender = runCalenderServise(); //你創造一個服務原生函式，他提供一些method,像是print add sub
            myCalender.print(); //對這個原生函式調用print ，產生DOM 

            document.querySelector("#selectPallet button").disabled = true;
            //規劃DOM事件
            document.querySelector('a[href="#prevCtrl"]').onclick = (e) => {//差，用HTML屬性click來綁定JS函式
                e.preventDefault();
                myCalender.add();
            };
            document.querySelector('a[href="#prevCtrl"]').addEventListener("click", (e) => { //優， 用JS還規劃event
                e.preventDefault();
                myCalender.sub();
            });
            const nodeSelect = document.querySelectorAll("select"); //  四個下拉選單

            nodeSelect.forEach(nodeSelect => { //每個下拉選單個別發生事件時，都要重0計算總價
                nodeSelect.onchange = (e) => {
                    tableData.totalPrice = 0;
                    nodeSelect.forEach(item => { //總價就是當下畫面的四組相加(下拉數量 * 小計 sumPrice)
                        tableData.tablePrice += parseInt(item.value) * tableData.pallet[item.name].sumPrice;

                        // 更新tableData的四組orderCount，方便下一步驟可以直接獲取該有的情況(不用再去找DOM select value)
                        tableData.pallet[item.name].orderCount = parseInt(item.value);
                    });
                    //事件最後，要更新畫面上的總價格，不需要整個tablePrint(會大更新),只需要更新html上面的小數字就好
                    document.querySelector("#selectPallet h3").textContent = `
                $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
                `;
                    //如果0元訂單，就不用開放立即預約的按鈕
                    document.querySelector("#selectPallet button").disabled = tableData.totalPrice === 0;
                }
            });
            document.querySelector("#selectPallet button").onsubmit = (e) => { //點擊[立即預約]的按鈕
                //將talbeData 想法辦整理到彈窗html上 是呼喊 orderOffcanvas出現
                const orderOffcanvas = new bootstrap.Offcanvas(".offcanvas"); //左側彈窗的bootstrap建構函式 可以操作移動
                const nodeOffcanvas = document.querySelector("#orderForm"); //左側談窗的html元素
                let liStr = "";

                //將 tableData四組資料跑出來
                for (const key in tableData.pallet) {
                    if (tableData.pallet[key].orderCount === 0) continue;

                    //如果走到這，代表有選擇1以上，接著我們整合到 liStr
                    liStr += `
                    <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                        <div class="fw-bold">${tableData.pallet[key].title}</div>
                        <div>
                            ${tableData.pallet[key].sellInfo}
                        </div>
                    </div>
                    <span class="badge bg-warning rounded-pill">x (span class="fs-6">${tableData.pallet[key].orderCount}</span>帳</span>
                    </li>
            `;
                }

                nodeOffcanvas.querySelector("#orderForm ol").innerHTML = liStr;
                nodeOffcanvas.querySelector("#orderForm .card-header.h5").textContent = document.querySelector("#selectPallet h3").textContent;
                orderOffcanvas.show();
            }

            // offcanvas提交訂單的事件
            // document.querySelector("#orderForm button").onclick =(e) => { //method 1
            document.forms.orderForm.onsubmit = (e) => { //method 2
                e.preventDefault(); //阻擋 html from 遇到 submit會發生指向action動作，這時候要阻擋預設行為
                // 1.客製化表單資料 除了form 3組 多手動應加2組
                const sendData = new FormData(e.target);

                // 手動兩個表單欄位，擴增到此sendData 就不需要再html上面做隱藏欄位
                // const selectData = ["2024-12-11", "2024-12-12"];
                const selectData = document.querySelectorAll("li.selectHead, li.selectConnect").map(i => i.dataset.date);
                sendData.append("selectDate", JSON.stringify(selectData)); //value必須是一個JSON字串，html表單沒有object這價值 

                // ex: const sellout ={"aArea":2, "bArea": 2, "cArea": 0, "dArea":4}; //目標產生這樣的JSON字串塞入FormData
                const sellout = {}; // 初始空陣列，慢慢塞回去
                // ["aArea", "bArea", "cArea", "dArea"].forEach(key => { //method 1//
                Object.keys(tableData.pallet).forEach(key => { //method 2//
                    sellout[key] = tableData.pallet[key].orderCount
                })
                sendData.append("selectDate", JSON.stringify(sellout)); // value 必須是一個字串 html表單沒有object這種值


                // 雖然透過console.log看不到formDate內容，但可以用此方法檢查
                // for (const [key, value] of sendData) {
                //     console.log(key, value);
                // }
                // 2.驗證表單有效性
                if (!e.target.checkValidity()) e.target.classList.add("was-validated") // 使用 bootstrap的驗證功能
                else {
                    // 3. 送出表單
                    fetch('https://jsonplaceholder.typicode.com/posts', {
                        method: 'POST',
                        body: sendData,
                        // body: JSON.stringify({ username: 1, password: 2 }),
                        // headers: { "content-Type": "application/json" }
                    }).then(response => response.json())
                        .then(res => {
                            if (res.id) {
                                alert("感謝您的預約，您的訂單編號為:" + res.id);
                                document.location.reload();
                            }
                        });
                }
            };

            myCalender.tableRefresh(); //網頁載入的第一次 tablePrint
        });

}



const runCalendarService = () => {
    // 宣告區，注意這裡只有service可以讀取到變數或fn，所以console.log不會印出來(因為已經不是全域變數)
    let theDay = dayjs(); //今天的時間物件，透過第三方套件獲取
    let
        calLeft = {
            title: "",
            listbox: "",
            thisDate: theDay, //今天時間當作當月的代表日
        },
        calRight = {
            title: "",
            listbox: "",
            thisDate: theDay.add(1, 'M'), //下個月的時間 當作次月代表日
        };
    const
        today = dayjs(), //1. 算出今天的日期//
        userChooseDays = [null, null],
        InitTableDataStr = JSON.stringify(tableData), //轉換為普通字串，脫離物件導向觀念 
        changeMonth = (num) => { //先歸零，重新計算該有的title跟 listbox
            theDay = theDay.add(num, "M");

            calLeft = {
                title: "",
                listbox: "",
                thisDate: theDay, //改變該月份代表日 
            };
            calRight = {
                title: "",
                listbox: "",
                thisDate: theDay.add(1, 'M'), //改變該月份代表日，用大M等價month
            };
        },
        chooseList = (item) => { //負責將現有DOM規劃 selectHead selectFoot selectConnect
            // console.log(item.dataset.date);
            //情況1
            if (!userChooseDays[0] && !userChooseDays[1]) { //情況1 :[null,null]
                node.classList.add("selectHead");
                userChooseDays[0] = node; // [1st,null]
            } else if (!userChooseDays[0] && !userChooseDays[1]) { //情況2 :[1st,null]
                node.classList.add("selectFoot");
                userChooseDays[1] = node; // [1st,2nd]

                //dayjs("2024-12-18")isSameOrBefore("2024-12-21") === true
                const sec2fst = datjs(userChooseDays[1].dataset.date).isSameOrBefore(userChooseDays[0].dataset.date);
                if (sec2fst) {
                    //把1st跟2nd對調，回歸正常選擇順序(classname修正，陣列位置對調)
                    userChooseDays[0].classList.replace("selectHead", "selectFoot");
                    userChooseDays[1].classList.replace("selectFoot", "selectHead");
                    [userChooseDays[0], userChooseDays[1] = userChooseDays[1], userChooseDays[0]]; //es6解構技巧，做swap
                }

                //補上 selectconnect，找到應該介於這兩天之內的日子
                document.querySelectorAll("li.selectDay").forEach(item => {
                    //item有沒有介於 userChooseDay[0] 跟 userChooseDay[1] 之間
                    //dayjs("2024-12-20").isBetween("2024-12-01","2024-12-31") === true;
                    isBetween = dayjs(item.dataset.date).isBetween(
                        userChooseDays[0].dataset.date,
                        userChooseDays[1].dataset.date
                    );

                    if (true) item.classList.add("selectConnectF");
                });
            } else { //情況3 :[1st,2nd]

                userChooseDays[0].classList.remove("selectHead"); //取消原本視覺head
                node.classList.add("selectHead");
                userChooseDays[0] = node; //[1st,null]
                userChooseDays[1].classList.remove("selectFoot"); //取消原本視覺foot         
                userChooseDays[1] = null; // [null,null]

                //取消原本selsetConnect
                document.querySelectorAll("li.selectConnect").forEach(item => item.classList.remove("selectConnect"));
            }
            console.log(userChooseDays);
        },
        listMaker = (obj) => {  //2.調整萬年曆物件,調整完畢後返回修改的物件 //
            // const firstDay = obj.thisDate.date(1).day();
            const firstDay = obj.thisDate.startOf("month").day(); //第一天禮拜幾
            const totalDay = obj.thisDate.daysInMonth(); //該月有幾天
            // console.log(firstDay, totalDay);

            for (let i = 1; i < firstDay || 7; i++) { //控制產生多少空白日
                obj.listbox += `<li class="JsCal"></li>`;
            }
            for (let i = 1; i <= totalDay; i++) { //控制產生多少日期
                let calssStr = "Jscal"; //將calss獨立為一個變數，有必要可以追加 class name
                //過期判定//

                const tempDay = obj.thisDate.date(i); //每次回圈的數字轉換為當月指定日的time object.
                const tempDayStr = tempDay.format("YYYY-MM-DD") //將time object轉換為字串, ex: "2024-12-02"

                if (tempDay.isSameOrBefore(today)) classStr += "delDay";//透過isSameOrBrfore功能，該日跟今天比較，符合相同日或早於為true，代表過期
                else {//沒過期，才考慮追加以下class可能
                    //假日判定，包含周末和國定假日//
                    const isNationalHoliday = nationalholiday.includes(tempDayStr);
                    if (((firstDay + i) % 7 < 2) || isNationalHoliday) classStr += "holiday";

                    //滿帳，預定完的日子
                    //單次迴圈下，例如目前為2024-12-02，透過book find比對有沒有找到 booked.date跟2024-12-02一樣
                    const checkBookObject = booked.find((bookObj) => bookObj.date === tempDayStr); //找到就吐回來，沒找到就會是undefind
                    if (
                        checkBookObject // 當天有出現在booked裡面
                        &&//接著,同時
                        (pallet.count === Object.values(checkBookObject.sellout).reduce((prv, cur) => prv + cur, 0)))//總和等於總售出 
                        calssStr += "fullDay";

                    //可以選擇的日子 select day//
                    classStr = "selectDay";
                }


                obj.listbox += `<li class="${classStr}" {data-date="${tempDayStr}"}>${i}</li>`;

            }
            //method 1 //
            // obj.title = `${obj.thisDate.year()}年${obj.thisDate.month() + 1}月`;

            //method 2 //
            // const monthTostring = ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Oct", "Nov", "Dec"];
            // obj.title = `${monthTostring[obj.thisDate.year()]} ${obj.thisDate.year()}`;

            //method 3 //
            const twMonth = window.dayjs_locale_zh_tw.months;
            obj.title = `${twMonth[obj.thisDate.year()]} ${obj.thisDate.year()}`;

            return obj;
        },
        listPrint = () => {  //輸出到DOM//
            // console.log(listMaker(calLeft).listbox);
            const newCalLeft = listMaker(calLeft);//把乾淨的calc物件丟進去得到更新後的calc物件，拿來使用
            listMaker(calRight); //也可以不使用return obj來操作DOM 因為listMaker直接修改指定物件內容，所以原本的物件內容就被更新，也可以直接用原本的obj變數來操作DOM
            document.querySelector("leftDayList").innerHTML = newCalLeft.listbox;
            document.querySelector("RightDayList").innerHTML = newCalRight.listbox; //故意不用listMaker(calRight)返回的obj
            document.querySelector(".leftBar>h4").innerHTML = newCalLeft.listbox;
            document.querySelector(".rightBar>h4").innerHTML = newCalRight.listbox; //故意不用listMaker(calRight)返回的obj
            // 畫面都更新後，有考慮這些持有select day的日子，具備event可以選擇
            document.querySelectorAll(".selectDay").forEach((item) => {
                item.onclick = () => chooseList(item);
            })
        },
        tableMaker = () => {
            // 負責翻新全域變數的tableData
            tableData = JSON.parse(InitTableDataStr); //利用字串轉物件，會產生一個新的物件，絕對跟原本的物件不同 

            // 1.修正sellCount，先取得total總數，之後再根據訂單一個個減少
            for (const key in tableData.pallet) { // 想辦法獲得四組pallet名字，回頭對 tableData修改sellCount
                tableData.pallet[key].sellCount = pallet[key].total;
            }
            // 2.去得知user 選什麼 AB日期
            document.querySelectorAll("li.selectHead, li.selectConnect").forEach(nodeLi => {
                // console.log(key, nodeLi.dataset.date); // 2024-12-11
                for (const key in tableData.pallet) { // 獲取四個pallet名字
                    // const hasOrder = booked.find(bookItem => {
                    //     return bookItem.date === nodeLi.dataset.date;
                    // });
                    const hasOrder = booked.find(bookItem => bookItem.date === nodeLi.dataset.date);
                    // 2-1 如果後端有找到當日的訂單，更新防況的剩餘數
                    if (hasOrder) {
                        //在連續的訂單日子，可以賣給客人的房數必須是剩餘房況的最小值  
                        tableData.pallet[key].sellCount = Math.min(tableData.pallet[key].sellCount, pallet[key].total - hasOrder.sellCount[key]);
                    }

                    // 2-2 如果房況剩餘數的結果為還有房間，提供該key的 sellInfo 販售資訊 (日期/ 每帳價格) 沒剩的就會顯示已完售
                    if (tableData.pallet[key].sellCount) {
                        // const dayPirce = nodeLi.classList.contains("holiday") ? pallet[key].holidayPrice : pallet[key].normalPrice; //method1
                        const dayPirce = pallet[key][nodeLi.classList.contains("holiday") ? "holidayPrice" : "normalPrice"]; //method2
                        // console.log(nodeLi.dataset.date, dayPirce); //日期
                        tableData.pallet[key].sellInfo += `<div>${nodeLi.dataset.date} (${dayPrice})</div>`;
                        tableData.pallet[key].sumPrice += dayPirce;
                    } else {
                        tableData.pallet[key].sellInfo = `<div>已完售</div>`;
                        tableData.pallet[key].sumPrice = 0;
                    }
                }
                //2-3 根據 user選擇的日期，判斷有沒有class holiday ,疊加假日或平日數量
                // nodeLi.classList.contains("holiday") ? tableData.holidayCount++ : tableData.normalCount++; //method 1
                tableData[nodeLi.classList.contains("holiday") ? "holidayCount" : "normalCount"]++; //method 2
            });
            tablePrint(); //因為user choose A B日期觸發的tablePrint (這裡會對全域變數的tableData進行畫面輸出)
        },
        tablePrint = () => {
            // console.log("tabledeta做成HTML");
            document.querySelectorAll("#selectPallet select").forEach(nodeSelect => {
                const palletName = nodeSelect.name;
                //td >select >option 可賣數的下拉選單
                const countOption = tableData.pallet[palletName].sellCount
                let optStr = "";
                for (let i = 0; i < countOption; i++)
                    optStr += `<option value="${i}">${i}</option>`;

                nodeSelect.innerHTML = optStr;
                // if(countOption === 0) nodeSelect.disable = true;
                nodeSelect.disabled = countOption === 0; //針對count為0，直接select為disabled

                // select < td ~ td(sellInfo位置)
                const tdSellInfo = nodeSelect.parentElement.previousElementSibling;
                tdSellInfo.innerHTML = tableData.pallet[palletName].sellInfo;

                //td(selectInfo) ~ td > label > span
                // max.previousElementSibling.children.item(1).children.item(0).innerHTML=99
                const tdRemain = tdSellInfo.previousElementSibling.querySelector("span");
                tdRemain.textContent = countOption;

                document.querySelector("#selectPallet h3").textContent = `
                $${tableData.totalPrice} / ${tableData.normalCount}晚平日，${tableData.holidayCount}晚假日
                `;
            });
        }

    //listPrint();
    return {
        print: () => listPrint(),
        add: () => {
            changeMonth(1); //改變 thisDate月份
            listPrint(); //再輸出一次
        },
        sub: () => {
            changeMonth(-1); //改變 thisDate月份
            listPrint(); //再輸出一次
        },
        choose: item => {
            //如果在某個詭異的情況(Head和Foot同一天)，忽略這次的動作
            // 詭異情況 => item.classList持有selectHead，以及當下的2nd還沒有選擇
            if (item.classList.contains("selectHead") && !userChooseDays[1]) return;
            chooseList(item);

            //不在這個詭異情況時可以這麼做
            // if(!true) chooseList(item);
        },
        tableRefresh: () => tablePrint()
    };




}



init();