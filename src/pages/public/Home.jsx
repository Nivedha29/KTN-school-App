import { useEffect, useState } from "react";

import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  Globe2,
  Heart,
  HeartHandshake,
  Laptop,
  Palette,
  Sparkles,
  Users,
} from "lucide-react";

import SectionTitle from "../../components/SectionTitle";

import {
  ASSETS,
  ROTATING,
  SUBJECTS,
  TEACHERS,
  TIMETABLE,
  VOICES,
} from "../../data/schoolData";

const HOME_CLASSES = [
  {
    grade: "Grade 1",
    row: TIMETABLE["Grade 1"][0],
  },
  {
    grade: "Grade 3",
    row: TIMETABLE["Grade 3"][1],
  },
  {
    grade: "Grade 5",
    row: TIMETABLE["Grade 5"][0],
  },
];

const HOME_TEACHERS = TEACHERS.slice(0, 4);

const SUBJECT_ROW_1 = SUBJECTS.filter(
  (_, index) => index % 2 === 0
);

const SUBJECT_ROW_2 = SUBJECTS.filter(
  (_, index) => index % 2 !== 0
);

export default function Home({
  onNavigate,
  onOpenImage,
}) {
  const [rotateIndex, setRotateIndex] =
    useState(0);

  const [voiceIndex, setVoiceIndex] =
    useState(0);

  useEffect(() => {
    const rotatingTimer = setInterval(() => {
      setRotateIndex(
        (current) =>
          (current + 1) % ROTATING.length
      );
    }, 2600);

    const voiceTimer = setInterval(() => {
      setVoiceIndex(
        (current) =>
          (current + 1) % VOICES.length
      );
    }, 4800);

    return () => {
      clearInterval(rotatingTimer);
      clearInterval(voiceTimer);
    };
  }, []);

  const voice = VOICES[voiceIndex];

  return (
    <div className="homePage">
      {/* ==================================================
          HERO
      ================================================== */}

      <section className="hero heroEnhanced">
        <div className="blob blobA" />
        <div className="blob blobB" />

        <div className="heroCopy">
          <div className="heroBadge">
            <Heart size={14} />
            100% volunteer-run
          </div>

          <h1>
            Learning without borders.
            <br />
            Growing together.
          </h1>

          <p>
            Free online education for children
            from Grade 1 to Grade 7, combining
            core school subjects, Indian
            languages, arts and a caring
            international community.
          </p>

          <div className="heroActions">
            <button
              className="primary heroPrimary"
              onClick={() =>
                onNavigate("apply")
              }
            >
              Request admission
              <ArrowRight size={17} />
            </button>

            <button
              className="heroSecondary"
              onClick={() =>
                onNavigate("classes")
              }
            >
              Explore classes
              <CalendarDays size={17} />
            </button>
          </div>

          <div className="rotateLine">
            <Sparkles size={15} />
            {ROTATING[rotateIndex]}
          </div>
        </div>

        {/* HERO VISUAL */}

        <div
          className="heroVisual"
          aria-label="KTN school community"
        >
          <img
            src={ASSETS.gallery[2].src}
            alt="KTN school community"
          />

          <div className="heroVisualOverlay" />

          <div
            className="
              floatingCard
              floatingCardTop
            "
          >
            <span className="floatingIcon">
              <Users size={18} />
            </span>

            <div>
              <strong>100+</strong>

              <small>
                Students learning together
              </small>
            </div>
          </div>

          <div
            className="
              floatingCard
              floatingCardBottom
            "
          >
            <span className="floatingIcon">
              <Globe2 size={18} />
            </span>

            <div>
              <strong>
                Global community
              </strong>

              <small>
                Learning from anywhere
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          STATS
      ================================================== */}

      <div className="stats statsEnhanced">
        <div>
          <strong>6+</strong>
          <span>Years together</span>
        </div>

        <div>
          <strong>100+</strong>
          <span>Students</span>
        </div>

        <div>
          <strong>28</strong>
          <span>Volunteer teachers</span>
        </div>

        <div>
          <strong>7</strong>
          <span>Grades</span>
        </div>
      </div>

      {/* ==================================================
          WHY KTN
      ================================================== */}

      <section
        className="
          homeSection
          homeSectionTint
        "
      >
        <SectionTitle
          eyebrow="Why KTN"
          title="A school built around children"
        />

        <p className="lead homeLead">
          Simple access, committed volunteer
          teachers and a warm learning
          environment help children stay
          connected to education and culture.
        </p>

        <div className="homeFeatureGrid">
          <article
            className="
              homeFeatureCard
              card
            "
          >
            <span className="homeFeatureIcon">
              <Laptop />
            </span>

            <h3>
              Live online learning
            </h3>

            <p>
              Join structured classes from
              home with teachers who know
              their students.
            </p>
          </article>

          <article
            className="
              homeFeatureCard
              card
            "
          >
            <span className="homeFeatureIcon">
              <HeartHandshake />
            </span>

            <h3>
              Volunteer powered
            </h3>

            <p>
              Teachers contribute their time
              so quality learning stays
              accessible and free.
            </p>
          </article>

          <article
            className="
              homeFeatureCard
              card
            "
          >
            <span className="homeFeatureIcon">
              <Globe2 />
            </span>

            <h3>
              Culture & community
            </h3>

            <p>
              Children learn languages and
              traditions while building
              friendships across regions.
            </p>
          </article>

          <article
            className="
              homeFeatureCard
              card
            "
          >
            <span className="homeFeatureIcon">
              <Palette />
            </span>

            <h3>
              Beyond academics
            </h3>

            <p>
              Dance, music, drawing and
              enrichment classes make
              learning broader and more
              joyful.
            </p>
          </article>
        </div>
      </section>

      {/* ==================================================
          UPCOMING CLASSES
      ================================================== */}

      <section className="homeSection">
        <div className="sectionHeadingRow">
          <SectionTitle
            eyebrow="Coming up"
            title="A glimpse of our weekly classes"
          />

          <button
            className="
              textLink
              desktopOnlyLink
            "
            onClick={() =>
              onNavigate("classes")
            }
          >
            Full timetable
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="homeClassGrid">
          {HOME_CLASSES.map(
            ({ grade, row }) => (
              <article
                className="
                  homeClassCard
                  card
                "
                key={`${grade}-${row[0]}`}
              >
                <div className="homeClassTop">
                  <span className="gradePill">
                    {grade}
                  </span>

                  <span className="dayPill">
                    {row[2]}
                  </span>
                </div>

                <h3>
                  {row[0]}
                </h3>

                <p>
                  {row[1]}
                </p>

                <div className="homeClassTime">
                  <Clock size={15} />
                  {row[3]}
                </div>
              </article>
            )
          )}
        </div>

        <button
          className="
            wideLink
            card
            mobileSectionLink
          "
          onClick={() =>
            onNavigate("classes")
          }
        >
          <span>
            <CalendarDays size={20} />
            View the full timetable
          </span>

          <ArrowRight size={18} />
        </button>
      </section>

      {/* ==================================================
          SUBJECTS
      ================================================== */}

      <section
        className="
          homeSection
          subjectSection
        "
      >
        <SectionTitle
          eyebrow="What we teach"
          title="School, language & creativity"
        />

        <p className="lead homeLead">
          From languages and core subjects
          to music, dance and creative
          learning.
        </p>

        <div className="subjectMarqueeGroup">
          <div
            className="
              subjectSlider
              subjectSliderLeft
            "
          >
            <div className="subjectSliderTrack">
              {[
                ...SUBJECT_ROW_1,
                ...SUBJECT_ROW_1,
                ...SUBJECT_ROW_1,
              ].map(
                (subject, index) => (
                  <span
                    className="subjectChip"
                    key={`left-${subject}-${index}`}
                  >
                    <BookOpen size={14} />
                    {subject}
                  </span>
                )
              )}
            </div>
          </div>

          <div
            className="
              subjectSlider
              subjectSliderRight
            "
          >
            <div className="subjectSliderTrack">
              {[
                ...SUBJECT_ROW_2,
                ...SUBJECT_ROW_2,
                ...SUBJECT_ROW_2,
              ].map(
                (subject, index) => (
                  <span
                    className="subjectChip"
                    key={`right-${subject}-${index}`}
                  >
                    <BookOpen size={14} />
                    {subject}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          TEACHERS
      ================================================== */}

      <section className="homeSection">
        <div className="sectionHeadingRow">
          <SectionTitle
            eyebrow="Our teachers"
            title="Meet the people behind KTN"
          />

          <button
            className="
              textLink
              desktopOnlyLink
            "
            onClick={() =>
              onNavigate("teachers")
            }
          >
            All teachers
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="homeTeacherStrip">
          {HOME_TEACHERS.map(
            (teacher) => (
              <article
                className="
                  homeTeacherCard
                  card
                "
                key={teacher.name}
              >
                <img
                  src={
                    ASSETS.photos[
                      teacher.key
                    ]
                  }
                  alt={teacher.name}
                />

                <div>
                  <h3>
                    {teacher.name}
                  </h3>

                  <p>
                    {teacher.role}
                  </p>

                  <small>
                    Teaching with KTN since{" "}
                    {teacher.joined}
                  </small>
                </div>
              </article>
            )
          )}
        </div>

        <button
          className="
            wideLink
            card
            mobileSectionLink
          "
          onClick={() =>
            onNavigate("teachers")
          }
        >
          <span>
            <Users size={20} />
            Meet all volunteer teachers
          </span>

          <ArrowRight size={18} />
        </button>
      </section>

      {/* ==================================================
          GALLERY
      ================================================== */}

      <section
        className="
          homeSection
          gallerySection
        "
      >
        <SectionTitle
          eyebrow="Life at KTN"
          title="Learning, celebrating & growing together"
        />

        <p className="lead homeLead">
          Classes are online, but the
          community extends far beyond
          the screen.
        </p>

        <div className="galleryStrip">
          {ASSETS.gallery.map(
            (photo, index) => (
              <button
                className="galleryPhoto"
                key={photo.src}
                onClick={() =>
                  onOpenImage(index)
                }
              >
                <img
                  src={photo.src}
                  alt={photo.cap}
                />

                <span>
                  {photo.cap}
                </span>
              </button>
            )
          )}
        </div>
      </section>

      {/* ==================================================
          TESTIMONIAL
      ================================================== */}

      <section className="testimonialSection">
        <div className="testimonialIntro">
          <span className="testimonialEyebrow">
            Voices of KTN
          </span>

          <h2>
            More than classes.
            <br />
            A community that grows together.
          </h2>
        </div>

        <div
          className="
            voiceCard
            card
            homeVoiceCard
          "
        >
          <div className="quoteMark">
            “
          </div>

          <p>
            {voice.q}
          </p>

          <strong>
            {voice.name}
          </strong>

          <span>
            {voice.role}
          </span>

          <div className="voiceDots">
            {VOICES.map(
              (_, index) => (
                <button
                  type="button"
                  aria-label={
                    `Show testimonial ${index + 1}`
                  }
                  className={
                    index === voiceIndex
                      ? "active"
                      : ""
                  }
                  key={index}
                  onClick={() =>
                    setVoiceIndex(index)
                  }
                />
              )
            )}
          </div>
        </div>
      </section>

      {/* ==================================================
          ADMISSION CTA
      ================================================== */}

      <section className="homeCta">
        <div>
          <span>
            Admissions
          </span>

          <h2>
            Ready to begin your
            child&apos;s KTN journey?
          </h2>

          <p>
            Send an admission request and
            the KTN team can follow up
            with you.
          </p>
        </div>

        <button
          className="ctaButton"
          onClick={() =>
            onNavigate("apply")
          }
        >
          Request admission
          <ArrowRight size={18} />
        </button>
      </section>
    </div>
  );
}