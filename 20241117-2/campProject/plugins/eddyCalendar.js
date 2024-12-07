dayjs.locale('zh-tw');
dayjs.extend(dayjs_plugin_isSameOrBefore);


//宣告全域變數//
let
    apiPath = './db.json',
    booked = [],
    nationholiday = [],
    pallet = {};

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

            //規劃DOM事件
            document.querySelector('a[href="#prevCtrl"]').onclick = (e) => {//差，用HTML屬性click來綁定JS函式
                e.preventDefault();
                myCalender.add();
            };
            document.querySelector('a[href="#prevCtrl"]').addEventListener("click", (e) => { //優， 用JS還規劃event
                e.preventDefault();
                myCalender.sub();
            });
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


                obj.listbox += `<li class="${classStr}">${i}</li>`;

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
        }
    };
}







init();