import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CELL_SIZE,
  HALF_CELL_SIZE,
  checkCollisionWithWalls,
  drawGrid,
  drawRobot,
  drawWalls,
} from "./App.utils";

function App() {    
  const canvasRef = useRef(null);
  // State for robot's position and direction
  const [position, setPosition] = useState({
    x: HALF_CELL_SIZE,
    y: HALF_CELL_SIZE,
    direction: 90,
  });
  const [walls, setWalls] = useState([
    { x: 30, y: 0, length: 90, horizontal: false }, // A vertical wall
    { x: 60, y: 30, length: 90, horizontal: true }, // A horizontal wall
    { x: 60, y: 60, length: 90, horizontal: true }, // A horizontal wall
  ]);

  const handleKeyPress = (event) => {
    switch (event.key) {
      case "ArrowUp":
        moveForward();
        break;
      case "ArrowDown":
        moveBackward();
        break;
      case "ArrowLeft":
        turnLeft();
        break;
      case "ArrowRight":
        turnRight();
        break;
      default:
        break; // Do nothing if other keys are pressed
    }
  };

  // Function to redraw the canvas
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(context, canvas.width, canvas.height, CELL_SIZE);
    drawWalls(context, walls);
    drawRobot(
      context,
      position.x,
      position.y,
      HALF_CELL_SIZE,
      position.direction
    );
  };

  useEffect(() => {
    // Set up the keydown event listener
    window.addEventListener("keydown", handleKeyPress);

    // Clean up the event listener
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    redrawCanvas();
  }, [position]); // Redraw when position changes

  // Move actions
  const moveForward = () => {
    const { x, y, direction } = position;
    let newX = x,
      newY = y;

    if (direction === 0 && y - CELL_SIZE >= 0) newY -= CELL_SIZE;
    else if (direction === 90 && x + CELL_SIZE < CANVAS_WIDTH)
      newX += CELL_SIZE;
    else if (direction === 180 && y + CELL_SIZE < CANVAS_HEIGHT)
      newY += CELL_SIZE;
    else if (direction === 270 && x - CELL_SIZE >= 0) newX -= CELL_SIZE;

    if (
      !checkCollisionWithWalls(newX, newY, walls, direction, true) &&
      (newX !== x || newY !== y)
    ) {
      setPosition({ x: newX, y: newY, direction });
    }
  };

  const moveBackward = () => {
    // Update position based on direction, moving backward
    const { x, y, direction } = position;
    let newX = x,
      newY = y;
    if (direction === 0 && y + CELL_SIZE < CANVAS_HEIGHT) newY += CELL_SIZE;
    else if (direction === 90 && x - CELL_SIZE >= 0) newX -= CELL_SIZE;
    else if (direction === 180 && y - CELL_SIZE >= 0) newY -= CELL_SIZE;
    else if (direction === 270 && x + CELL_SIZE < CANVAS_WIDTH)
      newX += CELL_SIZE;

    if (
      !checkCollisionWithWalls(newX, newY, walls, direction, false) &&
      (newX !== x || newY !== y)
    ) {
      setPosition({ x: newX, y: newY, direction });
    }
  };

  const turnLeft = () => {
    // Update direction by subtracting 90 degrees
    const newDirection = (position.direction - 90 + 360) % 360;
    setPosition({ ...position, direction: newDirection });
  };

  const turnRight = () => {
    // Update direction by adding 90 degrees
    const newDirection = (position.direction + 90) % 360;
    setPosition({ ...position, direction: newDirection });
  };

  const uTurn = () => {
    // Update direction by adding 180 degrees
    const newDirection = (position.direction + 180) % 360;
    setPosition({ ...position, direction: newDirection });
  };

  function decodeCipherArray(codedTextArray) {
    // Translation map based on the mappings we identified
    const translationMap = {
      a: "x",
      b: "y", //
      c: "z",
      d: "a", //
      e: "b", //
      f: "c",
      g: "d", //
      h: "e", //
      i: "f", //
      j: "g", //
      k: "h",
      l: "i", //
      m: "j",
      n: "k",
      o: "l", //
      p: "m",
      q: "n", //
      r: "o", //
      s: "p",
      t: "q",
      u: "r", //
      v: "s", //
      w: "t", //
      x: "u",
      y: "v",
      z: "w",
      0: "0",
      1: "1",
      2: "2",
      3: "3",
      4: "4",
      _: "?",
    };

    // Function to decode a single coded text
    const decodeText = (text) => {
      let decodedText = "";
      for (let char of text) {
        // Translate if the character is in the map, else return the character as-is
        decodedText += translationMap[char] || char;
      }
      return decodedText;
    };

    // Decode each string in the input array
    const decodedTextArray = codedTextArray.map((text) => decodeText(text));

    return decodedTextArray;
  }

  // Example usage:
  const codedTextArray = [
    "_ghdiehhi",
"_uhjjdh_ulgglp",
"_wuhqwh_",
"0aehqghu",
"0aelccb",
"0aeuhqw",
"0afbjddu",
"0agllg",
"0agxunoh",
"0ahoulf_hwk",
"0alw4l",
"0amxvwdghy",
"0andudwh",
"0aplnhwkuhh",
"0aporz",
"0atxlw",
"0avwhdgb",
"0avzdklol",
"0acdpxqgd",
"0acdpxqgd",
"1emda",
"3ruryln",
"3vodvkp",
"deudkdppdbrujd",
"dfhrqhghvljq",
"dgdpkxvwohv",
"dgdpvprrw",
"dnluduhordghg",
"dodqidofrq",
"doodglq_fubswr",
"doohbfdwqiw",
"dowfrlqfhr",
"dowv_dqrqbprxv",
"dqgu3z",
"dqgb8052",
"dqrqdndpljr",
"dqwkrqbwm20",
"dsh6743",
"dsh7458",
"dufdqlfqiw",
"dufklyxp_qm",
"duv0qlf",
"duv0qlf",
"duwrqeorfnfkdlq",
"dvkohbgfdq",
"dvnmhhpv",
"dyhqwxulqh_hwk",
"dap_adqghu",
"edjkroglqjqiwv",
"edqglwpihu",
"edqgrqiw",
"edqnv",
"eduwkdcldq",
"edbf5511",
"eljpdq3wk",
"eloobp2n",
"elwerbmdb",
"elwfrlqorxlh",
"eorfndqdold",
"eorqglh23opg",
"eoxhprrrq",
"erogohrqlgdv",
"eruhgdsh93",
"eruhgorjdqqc",
"eruqrvru",
"erwmdfnsrw",
"eudgbjzuljkw",
"euxqqrhwk",
"eubdqeulqnpdq",
"fdproqiw",
"fdugpdqmrqhv",
"fduolql8qiw",
"fkdgvfdoshu",
"fkdlqohiwlvw",
"fkdlqyluxv",
"fkdpsdjqhpdq",
"fkdpswjudp",
"folii_hvt",
"fprqhbwudglqj",
"frfr__ehdu",
"frqfuhwhqiw",
"frvwdiihfwlyh",
"frxvlqjuhjqiw",
"frcbzbdww",
"fu0vvhwk",
"fudvkeorvvrp1",
"fubswrkrrwnlqj",
"fubswrmg_1",
"fubswrsxqn3129",
"fubswrvwrup__",
"fubswrwvdu4",
"fxuyhwkrwv",
"fydoohb_",
"fberxujhrlvlh",
"g34wkvw4onhu",
"g3vn_",
"gdexqqbriilfldo",
"gdfkvkxqgzlcdug",
"gdpvnrwudghv",
"gdq_vlfnohv",
"gduolqjwrq",
"gduzlqqxqhchwk",
"gdy_lrw",
"ghdgsrodurlgc",
"ghexvvb100",
"ghfhqwudodlv",
"ghhseoxhvwhhyh",
"ghhch",
"ghjhqfkdulwb",
"ghjhqwudodqg",
"ghyrqiljxuhv",
"glqjdolqjwv",
"gmukhwruln",
"grmliols",
"grmlqqdwlrq",
"groodu_prqrsrob",
"gxwfkwlgh",
"gzbhu1987",
"gbodqruuhol",
"hdvbhdwverghjd",
"he7",
"howrurqiw",
"hwk_qdwlrq",
"hyloyrahov",
"hashfwhgydoxh_",
"idghgdoskd_",
"idurnk",
"imyge7",
"iodvkqiw",
"irpr_edjv",
"irredccohu",
"iravoljkwob",
"iaqfwlrq",
"jfdq9n",
"jhh__jdccd",
"jhjjohwr",
"jhwprrqjorz",
"jixqnhud86",
"jldqlqdvnduohww",
"jprqhbqiw",
"jrzhvwewf",
"judnhjudnh",
"juhjmuqrupdq",
"jxlgrglvdooh",
"kdquje",
"kduguljkwhgjh1",
"khgjhgkrj",
"khoorlpprujdq",
"khqor_hwk",
"khwkdwjlyhhwk",
"kljk_idghv",
"klmrkqerzhuv",
"kroodqghudgdp",
"krvvdib",
"kwnbhylq",
"kwnbhylq",
"kxqwhuruuhoo",
"kbshuvshn",
"l_dp_d_prpr",
"ldjrfyv",
"ldp_phwdplnh",
"ldpdtvdvkdlnk",
"ldpgflqyhvwru",
"loodgdsurgxfhu",
"lpqrwnluhl",
"lwphpxvkb",
"lcheho_hwk",
"m[vkrrn]",
"m1ppbhwk",
"mdgbvwdqd",
"mdplhvrqkloo",
"mgxeed",
"mhuhpbnqrzvyi",
"mihoocc",
"mkrojxlq",
"mrhbprrrvh",
"mrvlhehoolql",
"mxdqvqrz",
"mxoldnxhpshu",
"mxvwlqwulpeoh",
"ndljdql",
"ndqhzdoopdqq",
"nhylqilqdoervx",
"nlqghu_qiw_duw",
"nlwwbfdwuljkwp3",
"nprqhb_69",
"nqrzqdvgroodu",
"nrgdpd_hwk",
"nrcbdwwlf",
"nxurnhk",
"oduubdqodbdpdq",
"odcbsdqgd_01",
"oh9hgr",
"ohds_abc",
"ohfudeheohx",
"ohjhqg",
"ophrzlf",
"orehv604",
"orugf0cb",
"oruhn_whpsodu",
"oxfdqhwc",
"oxljl_qiw",
"oxnhfdqqrq727",
"pdffdqchwk",
"pdgpda_qiwv",
"pdjqxp",
"pdqwdqiw",
"pdund_hwk",
"pdunbphwdyhuvh",
"pdwwphgyhg",
"peo267_qiw",
"phdgrzpdutxh",
"phgldjludiihv",
"phwlqnxpux",
"plnhjhh",
"plnhb_elj69",
"plnlglgwklv",
"plqlvwhuriqiwv",
"prnvkd_gdv",
"prrqfdw2878",
"prrqryhuorug",
"pruhzloolh",
"prxwkhg_vnuuu",
"puizdvkhuh",
"qdkllnr",
"qdwhdohaqiw",
"qhvvqlvvod",
"qiwdubdqq",
"qiwerl_",
"qiwfdol_hwk",
"qiwodqg",
"qiwqrre",
"qiwwdqn",
"qiwzds",
"qlfnvgmrkqvrq",
"qrqixqjhuelov",
"qrwdjdpeou",
"qrwfubswreur",
"qrwiubgrwhwk",
"qrwwkuhdgjxb",
"qxoolqjhu",
"qbgrrupdq",
"rjgiduphu",
"rkkvklqb",
"rpc_qiw",
"rqobwrdvwhg",
"rwwrvxzhq",
"raabb13",
"sdudoohodluhy",
"sklolssojk",
"skrpr_hwk",
"sldqrpdq",
"slaov_grw_hwk",
"spdq555",
"srrslh",
"srurhwk",
"sudqnvb",
"surrifubswrghy",
"sxqn3178",
"sxqn6529",
"sbuff",
"sburqiw",
"udvloolgrwhwk",
"uhgehdugqiw",
"uhgolrqhbh",
"uhvddqj",
"ukhww",
"ulfhiduphuqiw",
"urfnhwjluoqiw",
"urxjkvsdunv",
"urxjkvsdunv",
"urbdwkb_",
"vdpvjpv",
"vdudk_vfulsw",
"vduwrvkl_uls",
"vdwpdq78704554",
"vfrww_ohz_lv",
"vhuf1q",
"vhujlwrvhujlwr",
"vkdqwbdgrq",
"vkleerohwk88",
"vko0pv",
"vlprq_jrogehuj",
"vlprq_vdbc13",
"vriwerrelh5",
"vrogwkherwwrp",
"vsdfhudfhua",
"vsdqnbexpsv",
"vtxljjohcccvtx1",
"vvmaew",
"vwhoodfdw4",
"vwudqjhqhljkeuv",
"vxshuuduhurvhv",
"wdgohhu",
"wdnhqvwkhruhp",
"wkdqnbrxa",
"wkhededjrrvh",
"wkhjuhhnwbfrrq1",
"wkhkrorfdw",
"wkhrqobqhvvlh",
"wkhsuri_vpv",
"wkhvpdupbexp",
"wklvlvqxvh",
"wkuhdgrru",
"wmf345",
"wrnhqira1",
"wrwgjewdje",
"wudyl3000",
"wuhhhwk",
"wuhyrumrqhvduw",
"wulvolw",
"wursriduphu",
"wvfkxxxxob",
"wzhhwb_qiw",
"xfflr_qiw",
"xowudsdud",
"ydoxhdqgwlph",
"ylfw1plch",
"yrkyrkk",
"yrqplvhv14",
"zdegrwhwk",
"zhuhnlwwb1",
"zlfnhgobqiw",
"zloo__sulfh",
"zlwkhuvsdqn",
"zlcdugrivrkr",
"zruogrierqcr",
"zveprg",
]; // Add more coded texts as needed
  const decodedTextArray = decodeCipherArray(codedTextArray);
  console.log(decodedTextArray);

  return (
    <div className="App">
      <header className="App-header">
        <canvas ref={canvasRef} />
        <div>
          <button onClick={moveForward}>Forward</button>
          <button onClick={moveBackward}>Backward</button>
          <button onClick={turnLeft}>Turn Left</button>
          <button onClick={turnRight}>Turn Right</button>
          <button onClick={uTurn}>U-Turn</button>
        </div>
      </header>
    </div>
  );
}

export default App;