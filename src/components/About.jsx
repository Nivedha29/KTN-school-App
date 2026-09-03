import { Globe2, HeartHandshake, Laptop, School } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { MILESTONES } from "../data/schoolData";

export default function About() {
  return (
    <>
      <SectionTitle
        eyebrow="About KTN"
        title="A school built by volunteers"
      />

      <p className="lead">
        KTN Digital Online School began in 2019 with a simple idea:
        children should be able to learn, connect and grow regardless
        of where they live.
      </p>

      <div className="featureGrid">
        <div className="card feature">
          <HeartHandshake />
          <h3>Always free</h3>
          <p>No tuition fees. Teachers volunteer their time.</p>
        </div>

        <div className="card feature">
          <School />
          <h3>Grades 1–7</h3>
          <p>
            Core school subjects plus languages and activities.
          </p>
        </div>

        <div className="card feature">
          <Laptop />
          <h3>Online</h3>
          <p>
            Children can participate from home using online classes.
          </p>
        </div>

        <div className="card feature">
          <Globe2 />
          <h3>Community</h3>
          <p>
            Families and teachers connect across countries.
          </p>
        </div>
      </div>

      <SectionTitle
        eyebrow="Our journey"
        title="From an idea to a community"
      />

      <div className="timeline">
        {MILESTONES.map((m, i) => (
          <div className="timelineItem" key={i}>
            <i style={{ background: m.color }} />

            <div>
              <small>{m.year}</small>
              <h3>{m.title}</h3>
              <p>{m.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}