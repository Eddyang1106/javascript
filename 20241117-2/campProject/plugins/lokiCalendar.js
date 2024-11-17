//宣告全域變數
let
    apiPath = "./db.json",
    booked = [],
    nationalHoliday = [],
    pallet = {};


//初始化作業
const init = () => {
    fetch("./db.json", { method: "GET" })
        .then(res => res.json())
        .then(json => {
            // booked = json.booked;
            // pallet = json.pallet;
            // nationalHoliday = json.nationalHoliday;
            ({ booked, pallet, nationalHoliday } = json);
            runCalenderServise();
        });
}

const runCalenderServise = () => {
    let theDay = dayjs();

    const
        today = dayjs(),
        calLeft = {
            title: "Left Calender",
            listBox: "",
            thisDate: theDay,
        },
        calRight = {
            title: "Right Calender",
            listBox: "",
            thisDate: theDay.add(1, "month"),
        },

        listMaker = (obj) => { //調整萬年曆物件,調整完畢後，返回修改後的物件(object)
            // const firstDay = obj.thisDate.date(1).day(); 筆記上面有寫的code
            const firstDay = obj.thisDate.startOf("month").day();  //該月第一天禮拜幾
            const totalDay = obj.thisDate.daysInMother(); // 該月有幾天
            // console.log(firstDay,totalDay);

            for (let i = 1; i < firstDay || 7; i++) { //控制產生多少空白日
                obj.listBox += `<li class="JsCal"></li>`;
            }//
            for (let i = 1; i < totalDay; i++) { //控制產生多少空白日
                obj.listBox += `<li class="JsCal"></li>`;
            }//
            // method2/////
            const monthIndexTostring = ["jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "sep", "Oct", "Nov", "Dec"];
            obj.title = `${monthIndexTostring[obj.thisDate.month()]} ${obj.thisDate.year()}`;
            //mothod3////


            return obj;
        },
        listPrint = () => { // 輸出到DOM
            // console.log(listMaker(calLeft).listBox);
            document.querySelector(".leftDayList").innerHTML = listMaker(calLeft).listBox;
            document.querySelector(".rightDayList").innerHTML = listMaker(calRight).listBox;

            document.querySelector(".leftBar>h4").innerHTML = listMaker(calLeft).title;
            document.querySelector(".rightBar>h4").innerHTML = listMaker(calRight).title;
        }
        
    listMaker();

}

init();
// consloe.log(123);