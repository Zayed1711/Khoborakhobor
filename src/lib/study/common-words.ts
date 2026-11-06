/**
 * Everyday English words a Bangladeshi student preparing for BCS/IELTS already knows,
 * including words that appear in almost every news story (government, police, minister,
 * election). The story vocabulary skips these and picks less common words instead.
 * Checked together with simple base forms ("workers" -> "worker", "blocked" -> "block").
 */
const LIST = `
a about above across act action active actually add added address admit adult affect after again against age ago agree ahead aid aim air all allow almost alone along already also although always among amount an and animal announce announced another answer any anyone anything appear apply area argue arm army around arrive art article as ask attack attention audience authority available average avoid away
baby back bad bag ball bank bar base basic be beat beautiful because become bed before begin behind believe below best better between beyond big bill billion bit black blood blue board boat body book born both box boy break bring brother budget build building business busy but buy by
call camera campaign can cancel candidate capital car card care career carry case cash catch cause cell center central centre century certain certainly chair challenge chance change character charge cheap check chief child children choice choose church citizen city civil claim class clear clearly close club coach coast cold collect college colour color come comment common community company compare complete computer concern condition conference confirm consider continue control cost could council count country couple course court cover create crime crisis cross crowd cultural culture cup current customer cut
damage danger dark data date daughter day dead deal death debate decade decide decision deep defence defense degree demand department depend describe design despite detail develop development die difference different difficult dinner direct direction director discover discuss discussion disease district do doctor dog door double down draw dream dress drink drive drop drug during duty
each early earn east easy eat economic economy edge education effect effort eight either election electric else employee end enemy energy enjoy enough enter entire environment equal especially establish even evening event ever every everybody everyone everything evidence exactly example exam examination exist expect experience expert explain eye
face fact factory fail fall family famous far farm farmer fast father fear federal feel feeling few field fifth fight figure file fill film final finally finance financial find fine finger finish fire firm first fish five floor fly focus follow food foot for force foreign forest forget form former forward four free freedom friend from front fuel full fund future
game garden gas general generation get girl give glass go goal gold good government great green ground group grow growth guard guess gun guy
hair half hall hand happen happy hard have he head health hear heart heat heavy help her here herself high him himself his history hit hold holiday home hope hospital hot hotel hour house how however huge human hundred hurt husband
i idea identify if ignore ill image imagine impact important improve in include including income increase indeed independent index indicate individual industry information inside instead institution interest international interview into invest investment involve island issue it item its itself
job join joint journalist judge jump just justice
keep key kid kill kind king kitchen know knowledge
labour labor lack lady land language large last late later laugh launch law lawyer lay lead leader learn least leave left leg legal less let letter level lie life light like likely limit line link list listen little live local long look lose loss lot love low
machine magazine main maintain major majority make man manage management manager many map mark market marriage material matter may maybe me mean measure media medical meet meeting member memory mention message method middle might military million mind minister ministry minute miss mission model modern moment money month more morning most mother move movement much murder music must my myself
name nation national natural nature near nearly necessary need network never new news newspaper next nice night nine no none nor north not note nothing notice now number
object obvious occur of off offer office officer official often oil ok old on once one only onto open operation opinion option or order organisation organization other others our out outside over own owner
page pain paper parent park part particular partner party pass past patient pattern pay peace people per percent perform performance perhaps period person personal phone physical pick picture piece place plan plant play player please plus point police policy political politics poor popular population position positive possible post pound power practice prepare present president pressure pretty prevent price prime principle prison private probably problem process produce product production professional program programme project property protect protest prove provide public publish pull purpose push put
quality question quick quickly quite
race radio rain raise range rate rather reach read ready real reality realise realize really reason receive recent recently recognise recognize record red reduce reflect region relate relationship release remain remember remove report represent republic require research resource respond response responsibility rest result return reveal rich right rise risk river road rock role room rule run rural
safe safety sale same save say scene school science score sea season seat second secretary section security see seek seem sell send senior sense series serious serve service session set seven several sex shake share she shoot shop short shot should shoulder show side sign significant similar simple simply since sing single sister sit site situation six size skill skin small smile so social society soldier some somebody someone something sometimes son song soon sort sound source south space speak special specific speech spend sport spring staff stage stand standard star start state statement station stay step still stock stop store story strategy street strike strong structure student study stuff style subject success successful such suddenly suffer suggest summer supply support sure surface system
table take talk target task tax teach teacher team technology television tell ten tend term test than thank that the their them themselves then theory there these they thing think third this those though thought thousand threat three through throughout throw thus time to today together tonight too top total tough toward towards town trade traditional traffic train training travel treat treatment tree trial trip trouble true truth try turn twice two type
under understand union unit united university unless until up upon us use usually
value various very victim view village violence visit voice vote voter
wage wait walk wall want war watch water way we weapon wear week weekend weight welcome well west western what whatever when where whether which while white who whole whom whose why wide wife will win window wish with within without woman women wonder word work worker world worry would write writer wrong
yard yeah year yes yesterday yet you young your yourself youth
accident according account achieve activity administration advantage advice afternoon agency agreement airport alliance ambassador anniversary apartment application approach arrest arrested assembly assistance association attempt award
background balance battle beach benefit billion bombing border bridge broadcast burn
cabinet capacity category ceremony chairman championship channel chemical citizenship coalition colleague commission committee competition complaint concert construction contract corruption cricket crop
deadline defeat delegation democracy deputy destroy detain diplomat disaster doctor donation
earthquake electricity embassy emergency employment engineer entertainment equipment estimate examination exchange exhibition export
facility festival flood football forecast fraud funding
gallery governor graduate guest
headquarters highway hospital hostage household
immigrant import injury inquiry inspection insurance investigation investor
journey
kidnap
landslide leadership legislation license licence loan
manufacturer mayor medicine meeting merchant minimum monitor
negotiation neighbour neighbor nominee
occupation opposition outbreak
parliament participant passenger penalty pension permission petrol pilot platform politician pollution port prosecutor protester province purchase
railway rally recovery referendum refugee regulation religion religious representative rescue reserve resident restaurant revenue
salary scheme scholarship secretary senate shortage shipment smuggle spokesman spokesperson sponsor stadium storm strategy subsidy suspect
teenager terrorist tournament tourist transport treasury tribunal
unemployment
vaccine vehicle victory volunteer
warehouse warning weather website welfare
announcement authorities commissioner controller department examinations institutions organisations represented
unable regular regularly surround surrounding dozen dozens killing garment basket packed arrange arranging accuse accused several currently previously immediately usually directly completely especially probably finally certainly clearly quickly recently nearly mostly mainly simply
wholesale market customer shopkeeper traffic morning evening afternoon tonight weekend
`;

export const COMMON_WORDS: Set<string> = new Set(LIST.split(/\s+/).filter(Boolean));

/** Simple base forms of an English word, for checking against the common list. */
export function baseForms(word: string): string[] {
  const w = word.toLowerCase();
  const forms = new Set([w]);
  const add = (x: string) => x.length >= 3 && forms.add(x);
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ied")) add(w.slice(0, -3) + "y");
  if (w.endsWith("ed")) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
    if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); // "stopped" -> "stop"
  }
  if (w.endsWith("ing")) {
    add(w.slice(0, -3));
    add(w.slice(0, -3) + "e");
    if (/(.)\1ing$/.test(w)) add(w.slice(0, -4));
  }
  if (w.endsWith("ly")) add(w.slice(0, -2));
  if (w.endsWith("er")) add(w.slice(0, -2));
  return [...forms];
}

export const isCommonWord = (word: string) => baseForms(word).some((f) => COMMON_WORDS.has(f));
