// Turns the lesson's JSON "content" array into React components, one per block type.
import HeadingBlock from './blocks/HeadingBlock.jsx';
import ParagraphBlock from './blocks/ParagraphBlock.jsx';
import CodeBlock from './blocks/CodeBlock.jsx';
import VideoBlock from './blocks/VideoBlock.jsx';
import MCQBlock from './blocks/MCQBlock.jsx';
import ListBlock from './blocks/ListBlock.jsx';
import TipBlock from './blocks/TipBlock.jsx';

const BLOCKS = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  list: ListBlock,
  tip: TipBlock,
  code: CodeBlock,
  video: VideoBlock,
  mcq: MCQBlock,
};

export default function LessonRenderer({ content = [] }) {
  let mcqNumber = 0;
  return (
    <div className="space-y-5">
      {content.map((block, i) => {
        const Block = BLOCKS[block?.type];
        if (!Block) return null; // unknown block types are skipped safely
        const extra = block.type === 'mcq' ? { number: ++mcqNumber } : {};
        return <Block key={i} {...block} {...extra} />;
      })}
    </div>
  );
}
