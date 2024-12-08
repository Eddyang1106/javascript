dayjs.locale('zh-tw')
dayjs.extend(dayjs_plugin_isSameOrBefore);
dayjs.extend(dayjs_plugin_isBetween);

//宣告全域變數
let
    apiPath = "./db.json",
    booked = [],
    nationalHoliday = [],
    pallet = {},
    myCalender = null,
    tableData = {
        totalPrice: 999,
        normalCount: 1,
        holidayCount: 5,
        pallet: {
            aArea: { title: '河畔 × A 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
            bArea: { title: '山間 × B 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
            cArea: { title: '平原 × C 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 },
            dArea: { title: '車屋 × D 區', sellCount: 0, sellInfo: '<div></div>', sumPrice: 0, orderCount: 0 }
        }
    };



//初始化作業
const init = () => {
    //安排工作打API
    fetch("./db.json", { method: "GET" })
        .then(res => res.json())
        .then(json => {
            // booked = json.booked;
            // pallet = json.pallet;
            // nationalHoliday = json.nationalHoliday;
            ({ booked, pallet, nationalHoliday } = json);

            const myCalender = runCalenderServise(); //你創造一個服務原生函式，他提供一些method,像是print add sub

            myCalender.print(); //對這個原生函式調用print ，產生DOM

            //規劃DOM事件
            document.querySelector('a[href="#prevCtrl"]').onclick = (e) => {//差，用HTML屬性click來綁定JS函式
                e.preventDefault();
                myCalender.add();
            };
            document.querySelector('a[href="#prevCtrl"]').addEventListener("click", (e) => { //優， 用JS還規劃event
                e.preventDefault();
                myCalender.sub();

            });

            const nodeSelect = document.querySelectorAll("select");

            nodeSelects.forEach(nodeSelect => { //每個下拉選單個別發生事件時，都要重0計算總價
                nodeSelect.onchange = (e) => {
                    tableData.totalPrice = 0;
                    nodeSelects.forEach(item => { //總價就是當下畫面的4組相加(下拉數量 * 小計 sumPrice)
                        tableData.totalPrice += parseInt(item.value) * tableData.pallet[item.name].sumPrice;

                        //更新tableData的四組orderCount,方便下一步驟可以直接獲取當下的選擇情況(不用再DOM去找 select value)
                        tableData.pallet[item.name].orderCount = parseInt(item.value);
                    });

                    //要更新畫面上的總價格，但不需要整個tablePrint(會大更新)，只需要更新html上面的小範圍就好
                    document.querySelector("#selectPallet h3").textContent = `
                    $${tableData.totalPrice} / ${tableData.normalCount}晚平日,${tableData.holidayCount}晚假日`;
                }
            });


            document.querySelector("#selectPallet button").onclick = (e) => { //點擊立即預約按鈕

                //將tableData 想辦法整理到彈窗html上 是呼喊orderOffcanvas出現
                const orderOffcanvas = new bootstrap.offcanvas(".offcanvas"); //左側談窗的bootstrap建構函式,可以操作動作
                const nodeOffcanvasf = document.querySelector("#orderForm"); //左側談窗的html元素
                let lister = "";

                //將tableData四組資料跑出來
                for (const key in tableData.pallet) {
                    if (tableData.pallet[key].orderCount === 0) continue;

                    //如果走到這  但表有選擇1以上 接著我們整合到liStr
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

                document.querySelector("ol").innerHTML = liStr;
                document.querySelector(".card-header.h5").textContent = document.querySelector("#selectPallet h3").textContent;
                orderOffcanvas.show();

            }
            document.querySelector("#orderForm").onsubmit = (e) => {
                e.preventDefault(); //阻擋html from遇到submit 會發生指向action動作，這時候要阻擋預設行為
                // 1.客製化表單資料 除了form 3組 多手動應加2組
                const sendData = new FormData(e.target);

                // 手動兩個表單欄位，擴增到此sendData，就不需要在html上面做隱藏欄位
                // const selectDate = ["2024-12-11","2024-12-12"];
                const selectDate = [...document.querySelectorAll("li.selectHead,li.selectConnect")].map(i => i.dataset.date);
                sendData.append("selectDate", JSON.stringify(selectDate)); //value必須是一個JSON字串 html表單沒有object這種值

                // ex: const sellout ={"aArea":2, "bArea": 2, "cArea": 0, "dArea":4}; //目標產生這樣的JSON字串塞入FormData
                const cellout = {};
                ["aArea", "bArea", "cArea", "dArea"].forEach(key => { //method1//
                    // Object.keys(tableData.pallet).forEach(key=>)
                    sellout[key] = tableData.pallet[key].orderCount
                })
                sendData.append("selectDate", JSON.stringify(sellout)); //value必須是一個字串 html表單沒有boject這種值
                // 2.驗證表單有效性//
                if (!e.target.checkValidity()) e.target.classList.add("was-validated")
                else {
                    //3.送出表單
                    fetch('https://jsonplaceholder.typicode.com/posts', {
                        method: 'POST',
                        body: sendData,
                    }).then(response => response.json())
                        .then(res => {
                            if (res.id) {
                                alert("感謝您的預約，您的訂單編號為:" + res.id);
                                document.location.reload();
                            }
                        });
                }
            };
            myCalender.tableRefresh();// 網頁載入的第一次 tablePrint
        });

    const runCalenderServise = () => {
        let theDay = dayjs();
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
            today = dayjs(),
            userChooseDays = [null, null],
            InitTableDataStr = JSON.stringify(tableData), //轉為普通字串，脫離物件導向觀念
            changeMonth = (num) => {//先歸零，重新計算該有的title跟 listbox
                theDay = theDay.add(num, "M"); //今天的時間物件，透過第三方套件獲取

                calLeft = {
                    title: "",
                    listBox: "",
                    thisDate: theDay, //改變該月份代表日 
                };
                calRight = {
                    title: "",
                    listBox: "",
                    thisDate: theDay.add(1, "M"), //改變該月份代表日，用大M等價month
                };
            },
            chooseList = (node) => { //負責將現有DOM規劃 selectHead, selectFoot， selectConnect
                // console.log(node.dataset.date);
                if (!userChooseDays[0] && !userChooseDays[1]) { //情況一 : [null,null]
                    node.classList.add("selectHead");
                    userChooseDays[0] = node; //[1st,null]
                } else if (userChooseDays[0] && !userChooseDays[1]) { //情況二 : [1st,null]
                    node.classList.add("selectFoot");
                    userChooseDays[1] = node; //[1st，2nd]
                    // dayjs("2024-12-18").isSameOrBefore("2024-12-21") === true
                    const sec2fst = dayjs(userChooseDays[1].dataset.date).isSameOrBebore(userChooseDays[0].dataset.date);
                    if (sec2fst) {

                    }
                    //補上 selectConnect，找到應該介於這兩天之內的日子
                    document.querySelectorAll("li.selectDay").forEach(item => {
                        // item有沒有介於 userChooseDay[0]跟userChooseDays[1] 之間
                        // dayjs("2024-12-20").isbetween("2024-12-01","2024-12-31") === true;
                        const isBetween = dayjs(item.dataset.date).isBetween(
                            userChooseDays[0].dataset.date,
                            userChooseDays[1].dataset.date
                        );

                        if (isBetween) item.classList.add("selectConnect");
                    });

                } else { //情況三:[1st，2nd]


                    userChooseDays[0].classList.remove("selectHead"); //取消原本視覺 head
                    node.classList.add("selectHead")
                    userChooseDays[0] = node; // [1st, null]
                    userChooseDays[1].classList.remove("selectFoot"); //取消原本視覺foot
                    userChooseDays[1] = null; // [null,null]
                    //取消原本 selectConnect
                    document.querySelectorAll("li.selectConnect").forEach(item => item.classList.remove("selectConnet"));
                }
                // console.log(userChooseDays);

            },

            listMaker = (obj) => { //調整萬年曆物件,調整完畢後，返回修改後的物件(object)
                // const firstDay = obj.thisDate.date(1).day(); 筆記上面有寫的code
                const firstDay = obj.thisDate.startOf("month").day();  //該月第一天禮拜幾
                const totalDay = obj.thisDate.daysInMother(); // 該月有幾天
                // console.log(firstDay,totalDay);

                for (let i = 1; i < firstDay || 7; i++) { //控制產生多少空白日
                    obj.listBox += `<li class="JsCal"></li>`;
                }

                for (let i = 1; i <= totalDay; i++) { //控制產生多少日期
                    let calssStr = "Jscal"; //將calss獨立為一個變數，有必要可以追加 class name
                    //過期判定//

                    const tempDay = obj.thisDate.date(i); //每次回圈的數字轉換為當月指定日的time object.
                    if (tempDay.isSameOrBefore(today)) classStr += "delDay";//透過isSameOrBrfore功能，該日跟今天比較，符合相同日或早於為true，代表過期
                    else {//沒過期，才考慮追加以下class可能

                        const tempDayStr = tempDay.format("YYYY-MM-DD") //將time object轉換為字串, ex: "2024-12-02"

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
                    }


                    obj.listBox += `<li class="${classStr}" data-date="${tempDayStr}">${i}</li>`;
                }
                // method1//
                // obj.title = `${obj.thisDate.year()年 ${obj.thisDate.month()+1}月`;

                // method2/////
                // const monthIndexTostring = ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Oct", "Nov", "Dec"];
                // obj.title = `${monthIndexTostring[obj.thisDate.month()]} ${obj.thisDate.year()}`;

                //mothod3////
                const twMoonth = window.dayjs_locale_zh_tw.months;
                obj.title = `${twMonth[obj.thisDate.month()]} ${obj.thisDate.year()}`;

                return obj;
            },
            tableMaker = () => {
                //負責翻新全域變數的tableData
                tableData = JSON.parse(InitTableDataStr); //利用字串轉物件，會整個產生一個新物件，絕對跟原本的物件不一樣

                // 1.修正 sellCount，先取得total，再根據訂單一個個減少
                for (const key in tableData.pallet) { // 獲得四組pallet名字，回頭對tableData修改sellCount
                    tableData.pallet[key].sellCount = pallet[key].total;//10
                }

                //2. 去得知user選啥AB日期
                document.querySelectorAll("li.selectHead, li.selectConnect").forEach(nodeLi => {
                    // console.log(key, nodeLi.dataset.date); //2024-12-11
                    for (const key in tableData.pallet) {
                        const hasOrder = booked.find(bookItem => booknodeLi.date === nodeLi.dataset.date); //arrow fi os more faster
                        // 2-1.如果後端有找到當天的訂單，更新防況的剩餘數
                        if (hasOrder) {
                            //再連續的訂單日子可以賣給客人的房數必須是這些剩餘房況的最小值
                            tableData.pallet[key].sellCount = Math.min(tableData.pallet[key].sellCount, pallet[key].total - hasOrder.sellout[key]);
                        }
                        //2-2.如果結論為房況有剩，顯示該key的sellInfo販售資訊 (日期/每帳價格) ;沒剩就顯示已完售
                        if (tableData.pallet[key].sellCount) {
                            // const dayPrice = nodeLi.classList.contains("holiday") ? pallet[key].holidayPrice : pallet[key].normalPrice; //method 1 //
                            const dayPrice = pallet[key][nodeLi.classList.contains("holiday") ? "holidayPrice" : "normalPrice"]; // method 2//

                            // console.log(nodeLi.dataset.date, dayPrice); //日期
                            tableData.pallet[key].sellInfo += `<div>${nodeLi.dataset.date}(${dayPrice}</div>)`;
                            tableData.pallet[key].sumPrice += dayPrice;
                        } else {
                            tableData.pallet[key].sellInfo = `<div>已售完</div>`;
                            tableData.pallet[key].sumPrice = 0;
                        };
                    };

                    //2-3.根據user選的日期，判斷有沒有class holiday ，疊加假日或平日數量
                    // nodeLi.classList.contains("holiday") ? tableData.holidayCount++ : tableData.normalCount++; //method1
                    tableData[nodeLi.classList.contains("holiday") ? "holiday" : "normalCount"]++; //method2 
                });
                console.log(tableData);



                tablePrint(); //因為user choose A B日期，觸發的tablePrint (這裡會對全域變數的tableData進行刷新畫面輸出)

            },
            listPrint = () => { // 輸出到DOM
                // console.log(listMaker(calLeft).listBox);
                const newCalLeft = newCalLeft;//把乾淨的calc物件丟進去得到更新後的calc物件，拿來使用
                listMaker(calRight);// 也可以不使用return obj 來操作DOM 因為listmaker直接修改指定物件內容 所以原本的物件就被更新，也可以直接用原本OBJ變數來操作DOM

                document.querySelector(".leftDayList").innerHTML = newCalLeft.listBox;
                document.querySelector(".rightDayList").innerHTML = newCalRight.listBox; //故意不用listMaker(calRight)返回的obj

                document.querySelector(".leftBar>h4").innerHTML = newCalLeft.title;
                document.querySelector(".rightBar>h4").innerHTML = newCalRight.title;//故意不用listMaker(calRight)返回的obj

                //畫面都更新後，考慮這些持有 selectDay的日子，具備 Event可以選擇
                document.querySelectorAll(".selectDay").forEach((item) => {
                    item.onclick = () => chooseList(item);
                })
            }
    }
    const
        today = dayjs(),
        userChooseDay = [null, null],
        changeMonth = (num) => {

        },
        chooseList = (node) => {

        },
        listMaker = (obj) => {
        },
        listPrint = () => {
        },
        tableMaker = () => {
            console.log(userChooseDays);
        },
        tablePrint = () => {
            // console.log("tableData做成HTML");
            document.querySelectorAll("form select").forEach(item => {
                const palletName = node.name;


                //td>select>option ? 個
                const countOption = tableData.pallet[palletName].sellCount
                let optStr = "";
                for (let i = 0; i < countOption; i++)
                    optStr += `<option valte="${i}"></option></option>`;

                node.innerHTML = optStr;
                // if(countOption === 0) node.disabled = true;
                node, disable = countOption === 0; //針對count為0 直接select 為disable

                // select < td~td(sellInfo位置)
                const sellInfoPlace = nodeSelect.parentElement.previousElementSibling;
                tdSellInfo.innerHTML = tableData.pallet[palletName].sellInfo;

                //td(selectInfo)~td
                // CSSMathMax.previousElementSibling.children.item(1).children.item(0).innerHTML=99
                const tdRemain = tdSellInfo.previousElementSibling.querySelector("span");
                tdRemain.textContent = countOption;
                //更新 tableData的四組orderCount，方便下一步驟
                document.querySelector("#selectPallet h3").textContent = `
                $${tableData.totalPrice} / ${tableData.normalCount}晚平日,${tableData.holidayCount}晚假日
                `;
                //如果0元訂單就不開放立即預約的按鈕
                document.querySelector("#selectPallet button").disable = tableData.totalPrice === 0;

            });
        }
    //listPrint();
    return {
        print: () => listPrint(),//外面的人可以控制service 何時才要輸出萬年曆
        add: () => {
            changeMonth(1); //改變 this Date月份
            listPrint(); //再輸出一次
        },
        sub: () => {
            changeMonth(-1); //改變 thisDate月份
            listPrint(); //再輸出一次
        },

        choose: item => {
            console.log(item);
            //如何某個詭異情況，忽略這次的動作
            if (true) return;
            chooseList(item);
            //不再這個詭異情況時可以做
            // if(!true) chooseList(item);
        },
        tableRefresh: () => tablePrint()
    };

}



init();
// consloe.log(123);