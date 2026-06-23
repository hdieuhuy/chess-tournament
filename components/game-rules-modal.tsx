import { Modal } from "./Modal";

type GameRulesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
};

export function GameRulesModal({ isOpen, onClose, gameId }: GameRulesModalProps) {
  let title = "Hướng Dẫn & Luật Chơi";
  let content = null;

  switch (gameId) {
    case "xiangqi":
      title = "Hướng Dẫn Luật Chơi Cờ Tướng";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Chiếu bí Tướng của đối phương để giành chiến thắng.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Tướng:</strong> Đi từng ô một, đi ngang hoặc dọc. Tướng luôn phải ở trong phạm vi "Cung". Hai Tướng không được nhìn thấy nhau trên cùng 1 cột dọc (lộ mặt tướng).</li>
            <li><strong>Sĩ:</strong> Đi chéo từng ô một. Sĩ luôn phải ở trong "Cung" để bảo vệ Tướng.</li>
            <li><strong>Tượng (Tịnh):</strong> Đi chéo 2 ô (điền chữ Điền). Tượng không được qua sông và không được đi nếu có quân chặn giữa đường đi (bị cản chân).</li>
            <li><strong>Xe:</strong> Đi ngang hoặc dọc không giới hạn ô, miễn là không bị chặn. Đây là quân cờ mạnh nhất.</li>
            <li><strong>Pháo:</strong> Đi ngang hoặc dọc giống như Xe. Nhưng khi ăn quân, Pháo phải nhảy qua đúng 1 quân bất kỳ (gọi là quân ngòi).</li>
            <li><strong>Mã:</strong> Đi thẳng 1 ô và chéo 1 ô (theo hình chữ L). Nếu có quân nằm ngay cạnh Mã theo đường thẳng, Mã bị "cản chân" và không thể đi theo hướng đó.</li>
            <li><strong>Tốt (Binh):</strong> Đi thẳng 1 ô mỗi nước. Khi chưa qua sông, Tốt chỉ được tiến. Khi đã qua sông, Tốt có thể tiến hoặc đi ngang 1 ô. Tốt không bao giờ được đi lùi.</li>
          </ul>
        </div>
      );
      break;

    case "chess":
      title = "Hướng Dẫn Luật Chơi Cờ Vua";
      content = (
        <div className="flex flex-col space-y-5 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Chiếu bí Vua của đối phương để giành chiến thắng. Bàn cờ gồm 64 ô (8x8) với hai màu sáng tối xen kẽ.
          </p>
          
          <div>
            <h4 className="font-bold text-indigo-700 mb-2">1. Cách di chuyển của các quân cờ:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Vua (King):</strong> Đi 1 ô theo mọi hướng (ngang, dọc, chéo). Vua không được đi vào ô bị đối phương kiểm soát (bị chiếu).</li>
              <li><strong>Hậu (Queen):</strong> Có thể đi dọc, ngang, chéo không giới hạn ô miễn là không bị cản. Hậu là quân cờ có sức mạnh lớn nhất.</li>
              <li><strong>Xe (Rook):</strong> Đi dọc và ngang không giới hạn ô miễn là không bị cản.</li>
              <li><strong>Tượng (Bishop):</strong> Đi chéo không giới hạn ô. Một Tượng chỉ đi trên các ô sáng màu, Tượng còn lại chỉ đi trên các ô tối màu.</li>
              <li><strong>Mã (Knight):</strong> Đi theo hình chữ L (tiến 2 ô thẳng rồi sang ngang 1 ô, hoặc tiến ngang 2 ô rồi lên/xuống 1 ô). <strong>Đặc biệt:</strong> Mã là quân duy nhất có thể nhảy qua đầu các quân khác.</li>
              <li><strong>Tốt (Pawn):</strong> Chỉ đi thẳng tiến về phía trước (không được lùi). 
                <ul className="list-circle pl-5 mt-1 text-slate-600">
                  <li>Nước đi đầu tiên của mỗi quân Tốt có thể chọn tiến 1 hoặc 2 ô. Từ nước thứ hai trở đi chỉ được tiến 1 ô.</li>
                  <li>Tốt bắt quân đối phương bằng cách đi chéo lên 1 ô (không ăn thẳng).</li>
                </ul>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-indigo-700 mb-2">2. Các nước đi đặc biệt:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Nhập thành (Castling):</strong> Là nước đi đặc biệt cho phép di chuyển cả Vua và Xe cùng lúc để bảo vệ Vua.
                <br/><em>Điều kiện:</em> Vua và Xe chưa từng di chuyển, không có quân nào đứng giữa Vua và Xe, Vua hiện không bị chiếu, và các ô Vua đi qua hoặc đứng lại không bị đối phương kiểm soát.
              </li>
              <li>
                <strong>Phong cấp (Promotion):</strong> Khi một quân Tốt đi đến hàng ngang cuối cùng của đối phương, nó bắt buộc phải được phong cấp thành Hậu, Xe, Tượng hoặc Mã (thường là Hậu).
              </li>
              <li>
                <strong>Bắt Tốt qua đường (En passant):</strong> Áp dụng khi quân Tốt của đối phương di chuyển 2 ô từ vị trí ban đầu và đứng ngay cạnh ngang với quân Tốt của bạn. Ngay ở lượt tiếp theo (và CHỈ ở lượt đó), Tốt của bạn có thể ăn Tốt đối phương như thể nó chỉ vừa bước lên 1 ô.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-indigo-700 mb-2">3. Kết thúc ván cờ:</h4>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Chiếu bí (Checkmate):</strong> Vua bị chiếu và không có cách nào hợp lệ để thoát khỏi nước chiếu. Người chiếu bí sẽ thắng.</li>
              <li><strong>Hòa cờ (Draw/Stalemate):</strong> Xảy ra khi Vua không bị chiếu nhưng người chơi đến lượt không có bất kỳ nước đi nào hợp lệ (cờ bí). Ngoài ra còn hòa do quy tắc lặp lại nước đi 3 lần, quy tắc 50 nước đi không có quân bị ăn hoặc Tốt di chuyển, hoặc cả 2 bên không đủ lực lượng để chiếu bí.</li>
            </ul>
          </div>
        </div>
      );
      break;

    case "go":
      title = "Hướng Dẫn Luật Chơi Cờ Vây";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Chiếm được nhiều "đất" (khu vực trống trên bàn cờ được vây kín bởi quân mình) hơn đối thủ.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cách chơi:</strong> Hai bên lần lượt đặt quân cờ vào các giao điểm của các đường kẻ. Đen đi trước. Đặt xuống không được di chuyển nữa.</li>
            <li><strong>Khí và Ăn quân:</strong> Khí là các giao điểm trống liền kề (ngang, dọc) với một quân hoặc đám quân. Khi một quân hoặc đám quân bị đối phương chặn hết Khí, chúng sẽ bị bắt và loại khỏi bàn cờ.</li>
            <li><strong>Điểm cấm đi:</strong> Không được đặt quân vào vị trí không có Khí, ngoại trừ trường hợp nước đi đó bắt được quân đối phương và tạo ra Khí.</li>
            <li><strong>Luật KO:</strong> Cấm đi nước cờ lập lại trạng thái bàn cờ trước đó của đối thủ ngay lập tức.</li>
          </ul>
        </div>
      );
      break;

    case "gomoku":
      title = "Hướng Dẫn Luật Chơi Cờ Caro";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Đặt 5 quân cờ liên tiếp theo hàng ngang, dọc hoặc chéo để chiến thắng.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cách chơi:</strong> Hai người thay phiên đặt quân X (màu đỏ) hoặc O (màu xanh lá) vào các ô trống trên bàn cờ.</li>
            <li><strong>Điều kiện thắng:</strong> Trò chơi kết thúc khi một bên có đúng 5 quân liền nhau (ngang, dọc, chéo). Tuy nhiên, áp dụng <strong>Luật Chặn 2 Đầu:</strong> Nếu 5 quân liền nhau bị đối phương chặn ở CẢ HAI ĐẦU, thì 5 quân đó KHÔNG được tính là chiến thắng. Nếu bàn cờ kín mà chưa ai thắng thì hòa.</li>
          </ul>
        </div>
      );
      break;

    case "checkers":
      title = "Hướng Dẫn Luật Chơi Cờ Đam";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Bắt hết quân của đối phương hoặc khiến đối phương không còn nước đi hợp lệ.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Di chuyển:</strong> Quân bình thường chỉ đi chéo lên 1 ô vào ô trống.</li>
            <li><strong>Ăn quân:</strong> Nhảy chéo qua quân đối thủ vào ô trống ngay phía sau để bắt quân. <strong>Luật Bắt Buộc Ăn:</strong> Nếu có cơ hội ăn quân, bạn BẮT BUỘC phải ăn, không được đi nước khác.</li>
            <li><strong>Phong Vua:</strong> Khi quân bình thường đi đến hàng cuối cùng phía đối diện, nó sẽ trở thành Vua. Vua có thể đi chéo tiến và chéo lùi.</li>
          </ul>
        </div>
      );
      break;

    case "battleship":
      title = "Hướng Dẫn Luật Chơi Bắn Thuyền";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Đánh chìm toàn bộ hạm đội tàu của đối thủ trước khi đối thủ làm điều tương tự với bạn.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Giai đoạn đặt tàu:</strong> Bạn có một số lượng tàu với các kích thước khác nhau. Hãy đặt chúng lên lưới của mình (ngang hoặc dọc). Tàu không được đè lên nhau. Đối phương sẽ không thấy tàu của bạn.</li>
            <li><strong>Giai đoạn bắn:</strong> Hai bên thay phiên bắn vào lưới của đối thủ bằng cách chọn một tọa độ.</li>
            <li>Nếu trúng tàu (Hit), ô đó sẽ đánh dấu đỏ. Nếu trượt (Miss), ô đánh dấu trắng.</li>
            <li>Một chiếc tàu bị chìm khi mọi phần của nó đều bị bắn trúng. Trò chơi kết thúc khi tất cả tàu của một bên bị chìm.</li>
          </ul>
        </div>
      );
      break;

    case "oanquan":
      title = "Hướng Dẫn Luật Chơi Ô Ăn Quan";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Tích lũy được nhiều điểm nhất (Dân = 1 điểm, Quan = 10 điểm) khi trò chơi kết thúc.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Rải quân:</strong> Đến lượt, người chơi bốc toàn bộ Dân ở một ô thuộc quyền kiểm soát của mình và rải lần lượt từng viên vào các ô tiếp theo (kể cả ô Quan) theo một hướng tùy chọn.</li>
            <li>Nếu ô liền sau ô cuối cùng có quân, người chơi bốc tiếp ô đó rải tiếp.</li>
            <li><strong>Ăn quân:</strong> Nếu ô liền sau ô cuối cùng là 1 ô trống, rồi đến 1 ô có quân, người chơi được ăn toàn bộ số quân ở ô đó. Có thể ăn liên tiếp nếu chuỗi "ô trống - ô có quân" lặp lại.</li>
            <li>Mất lượt khi ô liền sau ô cuối cùng là 2 ô trống, hoặc là ô Quan (chưa bị ăn).</li>
            <li><strong>Kết thúc:</strong> Trò chơi kết thúc khi 2 ô Quan đều bị ăn hết.</li>
          </ul>
        </div>
      );
      break;

    case "jungle":
      title = "Hướng Dẫn Luật Chơi Cờ Thú (Jungle)";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Di chuyển bất kỳ thú nào của mình vào hang của đối thủ, hoặc ăn hết thú của đối thủ.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Thứ tự thú (Từ mạnh đến yếu):</strong> Voi &gt; Sư Tử &gt; Hổ &gt; Báo &gt; Sói &gt; Chó &gt; Mèo &gt; Chuột.</li>
            <li>Thú mạnh hơn ăn được thú yếu hơn. Cùng cấp ăn được nhau. Ngoại lệ: Chuột ăn được Voi (chui vào tai voi). Voi không ăn được chuột.</li>
            <li><strong>Di chuyển:</strong> Đi 1 ô ngang hoặc dọc mỗi lượt.</li>
            <li><strong>Nước / Sông:</strong> Chỉ Chuột được xuống nước. Khi ở dưới nước, Chuột không thể ăn Voi trên bờ, nhưng có thể ăn Chuột đối phương dưới nước. Hổ và Sư Tử có thể nhảy qua sông theo chiều ngang hoặc dọc, nếu không có Chuột cản đường ở giữa.</li>
            <li><strong>Bẫy:</strong> Nếu thú của đối thủ bước vào ô bẫy phe mình, nó sẽ mất hết sức mạnh và bất kỳ thú nào của bạn cũng có thể ăn nó.</li>
          </ul>
        </div>
      );
      break;

    case "uno":
      title = "Hướng Dẫn Luật Chơi Bài UNO";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Đánh hết toàn bộ bài trên tay để giành chiến thắng.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Cách đánh:</strong> Bạn phải đánh 1 lá bài cùng <strong>Màu</strong> hoặc cùng <strong>Số / Ký Hiệu</strong> với lá bài trên cùng của xấp bài đánh.</li>
            <li>Nếu không có bài đánh, bạn phải Rút 1 lá từ xấp bài bốc. Nếu lá vừa rút đánh được, bạn có quyền đánh luôn lá đó hoặc Bỏ qua.</li>
            <li><strong>Hô UNO:</strong> Khi bạn đánh lá bài áp chót và chỉ còn đúng 1 lá bài trên tay, hệ thống sẽ tự động hô UNO giúp bạn.</li>
            <li><strong>Các lá chức năng:</strong>
              <ul className="list-circle pl-5 mt-1">
                <li><strong>Skip (Cấm lượt):</strong> Bỏ qua lượt của người tiếp theo.</li>
                <li><strong>Reverse (Đổi chiều):</strong> Đổi chiều vòng xoay đánh bài.</li>
                <li><strong>+2:</strong> Người tiếp theo phải rút 2 lá và mất lượt.</li>
                <li><strong>Wild (Đổi màu):</strong> Bạn được đánh ra và chọn màu cho lượt tiếp theo.</li>
                <li><strong>Wild +4 (Đổi màu + Rút 4):</strong> Chọn màu tiếp theo và người kế tiếp rút 4 lá, mất lượt. (Chỉ nên đánh khi không còn lá màu hợp lệ).</li>
              </ul>
            </li>
          </ul>
        </div>
      );
      break;

    case "exploding-kittens":
      title = "Hướng Dẫn Luật Chơi Mèo Nổ";
      content = (
        <div className="flex flex-col space-y-4 text-sm text-slate-700 leading-relaxed text-left">
          <p>
            <strong>Mục tiêu:</strong> Trở thành người sống sót cuối cùng mà không bị NỔ.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Lượt chơi:</strong> Bạn có thể đánh ra bao nhiêu lá bài chức năng trên tay tùy thích. Sau đó bạn kết thúc lượt bằng cách <strong>RÚT 1 LÁ BÀI</strong>.</li>
            <li><strong>Mèo Nổ (Exploding Kitten):</strong> Nếu rút trúng lá này, bạn bị nổ và loại khỏi game.</li>
            <li><strong>Gỡ Bom (Defuse):</strong> Nếu có lá Gỡ Bom, bạn dùng để sống sót khỏi Mèo Nổ và giấu lại Mèo Nổ vào một vị trí bí mật trong chồng bài rút.</li>
            <li><strong>Các lá bài chức năng:</strong>
              <ul className="list-circle pl-5 mt-1">
                <li><strong>Attack (Tấn công):</strong> Không cần rút bài, ép người tiếp theo phải chơi 2 lượt.</li>
                <li><strong>Skip (Bỏ qua):</strong> Không cần rút bài và kết thúc lượt hiện tại.</li>
                <li><strong>See the Future (Nhìn tương lai):</strong> Bí mật xem 3 lá bài trên cùng.</li>
                <li><strong>Alter the Future (Đổi tương lai):</strong> Xem 3 lá trên cùng và đổi vị trí của chúng.</li>
                <li><strong>Shuffle (Xào bài):</strong> Xáo trộn ngẫu nhiên chồng bài rút.</li>
                <li><strong>Nope (Không):</strong> Hủy bỏ tác dụng của một lá bài chức năng người khác vừa đánh (có thể Nope lại một cái Nope khác).</li>
                <li><strong>Favor (Nhờ vả):</strong> Ép người khác đưa cho bạn 1 lá bài họ chọn.</li>
                <li><strong>Combo Thường:</strong> Ghép 2 lá bài mèo giống nhau để cướp ngẫu nhiên 1 lá của đối thủ. Hoặc ghép 3 lá để đòi đích danh 1 lá.</li>
              </ul>
            </li>
          </ul>
        </div>
      );
      break;
    default:
      content = <p className="text-center text-sm text-zinc-500">Chưa có hướng dẫn cho trò chơi này.</p>;
  }

  return (
    <Modal isOpen={isOpen} title={title} styleClassWrapper="max-w-2xl">
      <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {content}
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={onClose}
          className="rounded-xl bg-zinc-900 px-8 py-3 font-bold text-white transition-colors hover:bg-zinc-800"
        >
          Đã hiểu
        </button>
      </div>
    </Modal>
  );
}
