import { FC, useState } from 'react';
import ReactTypescriptTemplateLogo from '../../assets/images/react-typescript-template.png';
import { AllInnerDesigns } from '../../bracelet-maker/designs/inner/all';
import { AllOuterDesigns } from '../../bracelet-maker/designs/outer/all';

const HomePage: FC = () => {
  const [innerDesign, setInnerDesign] = useState<string>(
    AllInnerDesigns[0].name
  );
  const [outerDesign, setOuterDesign] = useState<string>(
    AllInnerDesigns[0].name
  );

  const innerDesignClass = AllInnerDesigns.find((d) => d.name == innerDesign);
  const outerDesignClass = AllOuterDesigns.find((d) => d.name == outerDesign);

  if (!innerDesignClass || !outerDesignClass) {
    return <div>Design not found</div>;
  }

  const modelMaker = new outerDesignClass(new innerDesignClass());

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold my-2">React Typescript Template</h1>
      <img
        src={ReactTypescriptTemplateLogo}
        width={500}
        className="mx-auto"
        alt="React-Typescript-Template"
      />
    </div>
  );
};

export default HomePage;
