"use client";
import React, { useState } from 'react';
import { BookOpen, Users, Target, Award, TrendingUp, FileText, Download, ChevronRight } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import Footer from '@/components/Footer/Footer';

const AboutUsPage = () => {
    const [activeSection, setActiveSection] = useState('about');

    const sections = [
        { id: 'about', label: 'About ARIN', icon: Users },
        { id: 'case', label: 'The Case', icon: Target },
        { id: 'capacity', label: 'Capacity Gap', icon: TrendingUp },
        { id: 'initiatives', label: 'Our Initiatives', icon: Award },
        { id: 'academy', label: 'Publishing Academy', icon: BookOpen },
        { id: 'rationale', label: 'Rationale', icon: FileText },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-white">


                {/* Navigation Tabs */}
                <div className="sticky top-0 z-40 bg-white shadow-md border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex overflow-x-auto py-4 gap-2 no-scrollbar">
                            {sections.map((section) => (
                                <button key={section.id} onClick={() => setActiveSection(section.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap
                    transition-all duration-200 ${activeSection === section.id
                                            ? 'bg-[#021d49] text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <section.icon size={18} />
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* Sidebar - Table of Contents */}
                        <div className="lg:col-span-3">
                            <div className="sticky top-32 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
                                <h3 className="font-bold text-lg mb-4 text-gray-900">Quick Navigation</h3>
                                <nav className="space-y-2">
                                    {sections.map((section) => (
                                        <button key={section.id} onClick={() => setActiveSection(section.id)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex
                            items-center gap-2 ${activeSection === section.id
                                                    ? 'bg-blue-50 text-[#021d49] font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <ChevronRight size={16} />
                                            {section.label}
                                        </button>
                                    ))}
                                </nav>

                                <div className="mt-8 pt-6 border-t border-gray-200">
                                    <h4 className="font-bold text-sm mb-3 text-gray-900">Resources</h4>
                                    <a
                                        href="/documents/ARINPUBLISHNGACADEMYDOCUMENT.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-[#021d49] to-[#1e40af] text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                                    >
                                        <Download size={18} />
                                        Download PDF
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-9">
                            {/* About ARIN Section */}
                            {activeSection === 'about' && (
                                <div className="space-y-8">
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#021d49] rounded-xl flex items-center justify-center">
                                                <Users className="text-white" size={24} />
                                            </div>
                                            About the Africa Research and Impact Network
                                        </h2>

                                        {/* Image Placeholder */}
                                        <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200">
                                            <img src="/image/poster-launch.jpg" alt="ARIN Network"
                                                className="w-full h-64 object-cover" />
                                        </div>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                The Africa Research and Impact Network (ARIN) is an international think tank that
                                                amplifies African voices and research for impact. ARIN is a platform that brings
                                                together over 300 scholars, researchers, policymakers, and practitioners from across 40
                                                National Focal Points in African countries and the diaspora, promoting knowledge
                                                sharing, research excellence, and transformative policy action.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                ARIN's core focus is peer learning and sharing good transformative research and impact
                                                practices across Africa. It leverages its deep experience in generating and
                                                consolidating evidence on effective interventions across Africa's most critical
                                                strategic sectors and themes. Recognizing the continent's wealth of underutilized
                                                research, innovation, and best practices, ARIN fosters a unique platform for the
                                                science-policy interface. This platform bridges the gap by facilitating the sharing,
                                                profiling, and leveraging of the best research and impactful practices from diverse
                                                African contexts. Through this peer-to-peer exchange, ARIN empowers stakeholders to
                                                inform transformative policy action across the continent. ARIN's vision is to be the
                                                catalyst for Africa, where research excellence fuels transformative policy and
                                                sustainable development. ARIN envisions becoming Africa's foremost platform for
                                                advancing locally driven research, fostering impactful collaborations, and shaping
                                                sustainable development policies. By 2030, ARIN aims to address Africa's pressing
                                                challenges, leveraging the power of African knowledge systems and evidence-based
                                                solutions.
                                            </p>
                                        </div>

                                        {/* Stats Cards */}
                                        <div className="grid sm:grid-cols-3 gap-4 mt-8">
                                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                                <div className="text-3xl font-bold text-[#021d49] mb-1">300+</div>
                                                <div className="text-sm text-gray-600">Scholars & Researchers</div>
                                            </div>
                                            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                                <div className="text-3xl font-bold text-green-700 mb-1">40</div>
                                                <div className="text-sm text-gray-600">National Focal Points</div>
                                            </div>
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                                                <div className="text-3xl font-bold text-purple-700 mb-1">2030</div>
                                                <div className="text-sm text-gray-600">Vision Target Year</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* The Case Section */}
                            {activeSection === 'case' && (
                                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                            <Target className="text-white" size={24} />
                                        </div>
                                        The Case for a Publishing Academy
                                    </h2>

                                    {/* Image Gallery */}
                                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                        <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                                            <img src="/image/poster-launch.jpg" alt="African Researchers"
                                                className="w-full h-48 object-cover" />
                                        </div>
                                        <div className="rounded-xl overflow-hidden border-2 border-gray-200">
                                            <img src="/image/poster-launch.jpg" alt="Research Collaboration"
                                                className="w-full h-48 object-cover" />
                                        </div>
                                    </div>

                                    <div className="prose prose-lg max-w-none">
                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            Africa is home to a dynamic and expanding community of researchers, early-career academics,
                                            technical experts, and policy professionals generating critical insights across diverse
                                            domains, including climate change, public health, governance, and sustainable development.
                                            Despite this rich intellectual capacity, much of the continent's knowledge output remains
                                            underutilized or invisible in global arenas. This is largely due to the lack of structured,
                                            Africa-centered platforms that support effective research writing, scholarly publishing, and
                                            policy-oriented communication.
                                        </p>
                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            To bridge this persistent gap, there is a compelling case for establishing a pan-African
                                            publishing academy, that nurtures homegrown scholarship, builds research communication
                                            competencies, and strengthens Africa's voice in global knowledge systems. The Academy would
                                            not only serve as a launchpad for high-quality academic and policy outputs but also act as a
                                            catalyst for increasing African research visibility, fostering regional collaboration, and
                                            promoting equitable participation in global scholarly conversations.
                                        </p>
                                        <p className="text-gray-700 leading-relaxed">
                                            In positioning the Academy for broader and sustained impact, a structured alumni network,
                                            mentorship pipelines, and strategic partnerships with universities, research institutions,
                                            and publishers will be critical. These linkages will help institutionalize support for
                                            emerging researchers, drive long-term capacity building, and ensure the integration of
                                            African knowledge into global frameworks for evidence-informed development and policy
                                            dialogue.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Capacity Gap Section */}
                            {activeSection === 'capacity' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                                                <TrendingUp className="text-white" size={24} />
                                            </div>
                                            The Capacity Gap in Africa's Research and Publishing Landscape
                                        </h2>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Across Africa, there is a growing number of postgraduate programs and research
                                                initiatives housed within universities, think tanks, and policy institutions. This
                                                expansion has produced a vibrant community of postgraduate researchers, early-career
                                                academics, technical experts, and policy professionals who generate valuable insights on
                                                pressing development challenges. However, a critical gap persists: most of these
                                                individuals lack structured, Africa-specific training in academic writing, publishing
                                                processes, and knowledge translation.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Many researchers struggle to frame their work for peer-reviewed journals, navigate
                                                editorial and peer-review systems, and meet the standards required by international
                                                publishing platforms. Despite producing strong academic theses and dissertations, most
                                                postgraduate students graduate without exposure to global norms for scholarly
                                                publishing, open-access practices, or ethical authorship. As a result, their work often
                                                remains unpublished, disconnected from global academic conversations, and inaccessible
                                                to broader audiences.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed">
                                                This challenge is compounded by weak dissemination channels, limited indexing of African
                                                research in high-impact journals, and the absence of institutional platforms that
                                                support scholarly communication and policy engagement. Consequently, a vast reservoir of
                                                high-potential African research remains invisible, undermining opportunities for
                                                knowledge uptake, policy influence, and global impact.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Beyond Academia: Policy and
                                            Practice-Oriented Writing Deficits</h3>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Beyond the walls of academia, professionals across government agencies, NGOs, civil
                                                society organizations, and the private sector are increasingly expected to engage with
                                                and produce evidence-based communication products. These include policy briefs,
                                                technical reports, op-eds, working papers, and advocacy memos. These formats demand a
                                                distinct set of skills from traditional academic writing. However, the capacity to craft
                                                such outputs remains limited.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Many professionals lack access to structured training, mentorship, or editorial support
                                                to develop high-quality, context-relevant materials aligned with global standards. This
                                                gap in policy-oriented communication significantly weakens the ability to translate
                                                research and technical evidence into actionable insights. As a result, valuable
                                                knowledge often fails to reach decision-makers or influence public discourse in
                                                meaningful ways.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed">
                                                The consequences are far-reaching, including weak communication capacity, which hampers
                                                evidence uptake in policymaking, reduces the effectiveness of advocacy, and perpetuates
                                                the disconnect between research and real-world impact. It also sidelines
                                                context-specific African knowledge that could drive more inclusive, equitable, and
                                                responsive development outcomes. Addressing this deficit is critical for strengthening
                                                the science-policy-practice interface and ensuring that Africa's research contributions
                                                shape both national strategies and global debates.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Structural and Institutional Barriers</h3>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                The persistent capacity gap in Africa's research ecosystem is deeply rooted in
                                                structural and institutional limitations. Chief among these is the absence of
                                                well-established platforms that provide systematic training, mentorship, and long-term
                                                support in academic writing and scholarly publishing. Most existing capacity-building
                                                mechanisms are fragmented, sporadic, donor-dependent, or narrowly focused on specific
                                                disciplines. As a result, researchers working in critical yet underfunded fields, such
                                                as the social sciences, environmental sustainability, climate resilience, and gender,
                                                are often left without pathways to publishing success. This challenge is further
                                                compounded by the lack of open-access publishing infrastructure and the prohibitive
                                                costs of article processing charges, which continue to marginalize African authors. At
                                                the institutional level, research priorities are frequently skewed towards economically
                                                driven and technologically oriented disciplines like medicine, engineering, and
                                                business. This leaves limited space and support for multidisciplinary research and
                                                teaching, especially in areas that are essential for addressing complex development
                                                challenges.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed">
                                                Moreover, poor data availability, inconsistent standards, fragmented storage formats,
                                                and limited open data practices hinder the quality and reach of African research. These
                                                constraints restrict researchers' ability to generate, analyze, and disseminate robust
                                                evidence. The lack of institutional access to a diverse array of academic journals
                                                further isolates scholars from evolving global knowledge systems, weakens teaching
                                                quality, and limits opportunities for publication, international engagement, and
                                                conference participation. Without sustained investment in inclusive infrastructure,
                                                equitable publishing pathways, and data-driven research support, African scholars will
                                                remain constrained in their ability to participate meaningfully in regional and global
                                                academic and policy dialogues.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Initiatives Section */}
                            {activeSection === 'initiatives' && (
                                <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                    <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                                            <Award className="text-white" size={24} />
                                        </div>
                                        ARIN's Ongoing Initiatives
                                    </h2>

                                    <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200">
                                        <img src="/image/poster-launch.jpg" alt="ARIN Initiatives"
                                            className="w-full h-64 object-cover" />
                                    </div>

                                    <div className="prose prose-lg max-w-none">
                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            The African Research and Impact Network (ARIN) has laid strong foundations to address the
                                            structural and capacity challenges limiting African research visibility and policy
                                            engagement. Through its Africa Science-Policy Fellowship Program (AS-PFP), ARIN has created
                                            dynamic platforms for early-career researchers and policy practitioners to co-produce
                                            knowledge, engage in regional science-policy dialogues, and receive targeted mentorship and
                                            training. The program champions evidence-based decision-making and knowledge co-creation
                                            while institutionalizing science-policy engagement across the continent.
                                        </p>

                                        <div className="bg-blue-50 border-l-4 border-[#021d49] p-6 rounded-r-xl my-6">
                                            <h4 className="font-bold text-lg text-gray-900 mb-3">The AS-PFP is guided by two core goals:
                                            </h4>
                                            <ul className="space-y-2 text-gray-700">
                                                <li className="flex items-start gap-2">
                                                    <span className="text-[#021d49] font-bold mt-1">a)</span>
                                                    <span>to consolidate evidence from diverse African contexts and leverage it for
                                                        policy support and capacity building, and</span>
                                                </li>
                                                <li className="flex items-start gap-2">
                                                    <span className="text-[#021d49] font-bold mt-1">b)</span>
                                                    <span>to promote research excellence and the sharing of best practices for impactful
                                                        scholarship.</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            It has a proven track record of delivering high-level dialogues, regional case studies, and
                                            thematic knowledge syntheses that connect research to real-world policy challenges.
                                        </p>

                                        <p className="text-gray-700 leading-relaxed mb-4">
                                            To further advance this agenda, ARIN is leveraging its strategic Memorandum of Understanding
                                            with the Taylor & Francis Group, a key partner in enabling equitable access to global
                                            publishing platforms. Through this partnership, ARIN seeks to:
                                        </p>

                                        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 pl-4">
                                            <li>Establish institutional champions to advocate for inclusive journal access.</li>
                                            <li>Nurture future institutional leaders who appreciate the value of equitable knowledge
                                                ecosystems; and</li>
                                            <li>Build stronger bridges between academia, policy, and publishing to harmonize efforts in
                                                strengthening Africa's contribution to evidence-informed development.</li>
                                        </ul>

                                        <p className="text-gray-700 leading-relaxed">
                                            These efforts are part of ARIN's broader mission to democratize knowledge production,
                                            support the next generation of African scholars, and amplify African voices in global
                                            academic and policy spaces.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Publishing Academy Section */}
                            {activeSection === 'academy' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#021d49] rounded-xl flex items-center justify-center">
                                                <BookOpen className="text-white" size={24} />
                                            </div>
                                            ARIN Publishing Academy
                                        </h2>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Recognizing the urgent need to enhance the visibility of African research, strengthen
                                                scholarly communication, and build lasting capacity among researchers, the African
                                                Research and Impact Network (ARIN) proposes the establishment of the ARIN Publishing
                                                Academy. This continental initiative will serve as a structured, Africa-specific
                                                platform to support both emerging and established scholars in producing and
                                                disseminating high-quality academic and policy-relevant outputs. The ARIN Publishing
                                                Academy is therefore envisioned as an inclusive, pan-African platform to address this
                                                research and publishing gap. It will serve as a continental centre for capacity building
                                                in research writing, scholarly publishing, and knowledge translation. It will equip
                                                researchers and professionals alike with the competencies, networks, and opportunities
                                                they need to contribute meaningfully to academic, policy, and public conversations,
                                                whether through peer-reviewed journals, national policy dialogues, or global knowledge
                                                exchanges.
                                            </p>

                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Building on ARIN's robust foundation, including its Science-Policy Fellowship Program
                                                (AS-PFP) and strategic partnership with Taylor & Francis Group, the Academy will align
                                                with ARIN's broader mission of strengthening the science-policy-practice interface. It
                                                is envisioned as a springboard for African researchers to confidently publish impactful
                                                work, navigate the complexities of scholarly publishing, and translate evidence into
                                                actionable communication for decision-makers. With a strong commitment to equity,
                                                openness, and inclusion, the Academy will offer a contextualized and interdisciplinary
                                                support system tailored to Africa's diverse research ecosystem. Its core services will
                                                include:
                                            </p>

                                            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6 pl-4">
                                                <li>Structured training programs on academic writing, peer-reviewed publishing, and
                                                    policy-oriented communication.</li>
                                                <li>Thematic writing workshops aligned with pressing development and policy agendas.
                                                </li>
                                                <li>Mentorship and coaching, connecting early-career researchers with experienced
                                                    academics and editors.</li>
                                                <li>Editorial support to improve the quality and readiness of manuscripts.</li>
                                                <li>Capacity development for non-academic stakeholders, including civil society actors,
                                                    practitioners, and policymakers, to improve evidence-based communication.</li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#021d49] to-[#1e40af] rounded-2xl shadow-lg p-8 text-white">
                                        <h3 className="text-2xl font-bold mb-4">Driving Research Output and Quality through Targeted
                                            Programming</h3>
                                        <p className="text-blue-100 leading-relaxed mb-6">
                                            To ensure the ARIN Publishing Academy contributes meaningfully to Africa's research
                                            productivity, the initiative will embed targeted mechanisms that improve the quality,
                                            visibility, and volume of scholarly outputs. Key strategies include:
                                        </p>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <h4 className="font-bold mb-2">Regular Peer Review Sessions</h4>
                                                <p className="text-sm text-blue-100">Participants will engage in structured peer review
                                                    exercises, allowing them to critique and improve each other's work in a
                                                    collaborative and supportive environment. This will build confidence and familiarity
                                                    with editorial standards while enhancing manuscript quality.</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <h4 className="font-bold mb-2">Publication Incentives</h4>
                                                <p className="text-sm text-blue-100">The Academy will establish recognition mechanisms,
                                                    such as awards, fellowships, or visibility campaigns, for participants who
                                                    successfully publish their work in peer-reviewed journals or contribute to
                                                    policy-relevant outputs post-training.</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <h4 className="font-bold mb-2">Iterative Feedback Mechanisms</h4>
                                                <p className="text-sm text-blue-100">Researchers will benefit from continuous,
                                                    constructive feedback loops throughout their writing process. This approach will
                                                    support iterative improvement of manuscripts and improve readiness for submission to
                                                    reputable journals.</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                                <h4 className="font-bold mb-2">Promotion of Interdisciplinary Research</h4>
                                                <p className="text-sm text-blue-100">The Academy will actively encourage
                                                    cross-disciplinary collaboration across its cohorts, promoting diverse perspectives
                                                    and fostering innovative, solution-oriented research outputs that are relevant to
                                                    complex development challenges.</p>
                                            </div>
                                        </div>

                                        <p className="text-blue-100 leading-relaxed mt-6">
                                            By embedding these elements into its core programming, and leveraging the editorial,
                                            publishing, and review expertise available through its partnership with Taylor & Francis,
                                            the Academy will position itself as a catalyst for increased, high-quality African
                                            scholarship that resonates within both academic and policy spaces.
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">ARIN Infrastructure and Institutional
                                            Strength</h3>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed">
                                                ARIN's capacity rests on its available wide network of Scholars, Research Fellows,
                                                Policymakers, and Community of Practices endowed with different skills, as well as its
                                                existing research ecosystem-supporting infrastructure, such as Data Centre and
                                                Interactive Data Platforms, such as LAMA and CAPCHA, that support its quest for
                                                establishing a leading Publishing Academy in Africa. The Academy aims to leverage its
                                                pool of researchers equipped with data management, analysis, and visualization skills,
                                                alongside its Data Centre and platforms like LAMA and CAPCHA, to advance data-driven
                                                research and policy engagement. Through this approach, the Academy will promote the
                                                production of high-quality, publishable empirical research by building the capacity of
                                                early-career researchers in data collection, analysis, and communication. Additionally,
                                                it will enhance their ability to disseminate data-informed insights, especially in the
                                                era of Big Data and Artificial Intelligence, by facilitating continuous learning, global
                                                mentorship, and exposure to emerging tools and techniques in empirical research
                                                dissemination.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Rationale Section */}
                            {activeSection === 'rationale' && (
                                <div className="space-y-6">
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                                                <FileText className="text-white" size={24} />
                                            </div>
                                            Rationale for the ARIN Publishing Academy
                                        </h2>

                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Africa's Research and Development
                                            Challenge</h3>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Africa's development is constrained by persistent poverty, climate vulnerabilities, and
                                                systemic health and governance challenges. Addressing these issues requires robust,
                                                evidence-informed policymaking, yet the continent struggles to translate research into
                                                action. According to the 2023 Global Innovation Index, Africa continues to rank low in
                                                research impact and commercialization. This is largely due to under investment in R&D
                                                (still below the 1% of GDP target set in Agenda 2063 and STISA-2024), heavy reliance on
                                                external funding, and limited capacity for research uptake and communication.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                While initiatives like the Science Granting Councils Initiative have attempted to
                                                improve evidence use in policymaking, institutional fragilities and fragmented systems
                                                hinder long-term impact. African universities and think tanks often lack the autonomy,
                                                platforms, and incentives to develop and disseminate Africa-led knowledge. Moreover, the
                                                research that is generated frequently remains inaccessible or in formats not tailored
                                                for policy use.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                There is also a disconnect between knowledge production and knowledge translation.
                                                Researchers, governments, and NGOs lack sustained mechanisms for collaboration,
                                                learning, and co-creation. The result is a cycle of underutilized research outputs and
                                                missed opportunities for influence in both national and global conversations. To date,
                                                there are few dedicated forums in Africa to interrogate the science-policy interface or
                                                systematically build capacities for research communication, particularly in emergent
                                                fields like climate change, artificial intelligence, and sustainable development.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Addressing the Evidence Generation and
                                            Communication Gap</h3>

                                        <div className="prose prose-lg max-w-none">
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                Bridging the gap between research and policy requires more than producing evidence. It
                                                demands the ability to interpret, package, and communicate that evidence effectively.
                                                Yet many African professionals, from postgraduate students to senior advisors, receive
                                                little or no training in academic publishing or policy communication. Challenges such as
                                                poor access to journals, high publication fees, weak mentorship, and inadequate writing
                                                skills contribute to low publication rates and reduced policy engagement.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                The ARIN Publishing Academy responds to this gap by positioning itself as a
                                                transformative capacity-building hub. It aims to equip researchers and practitioners
                                                with the skills to publish impactful research and translate findings into actionable
                                                knowledge. This is not merely a technical intervention; it is a structural response to
                                                build a new generation of African knowledge leaders across sectors.
                                            </p>
                                            <p className="text-gray-700 leading-relaxed mb-4">
                                                The Academy builds on ARIN's strategic partnership with Taylor & Francis Group. Through
                                                this collaboration, African scholars gain access to publishing opportunities in globally
                                                recognized journals, training sessions by publishing professionals, and mentorship from
                                                experienced editors. The Academy serves as a complementary mechanism for increasing
                                                research visibility, fostering collaboration, and enhancing the quality and policy
                                                relevance of African scholarship.
                                            </p>

                                            <div
                                                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 my-6 border border-blue-200">
                                                <h4 className="font-bold text-lg text-gray-900 mb-3">Key Interventions:</h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-[#021d49] rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-gray-700"><strong>Enhancing academic writing and publishing
                                                            skills:</strong> Through targeted training on manuscript development,
                                                            peer review navigation, and ethical publishing practices, the Academy will
                                                            support African scholars in producing high-quality, peer-reviewed research
                                                            outputs.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-[#021d49] rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-gray-700"><strong>Bridging research and policy
                                                            communication:</strong> The Academy will train participants to craft
                                                            policy briefs, opinion pieces, and strategic reports that translate complex
                                                            research into usable knowledge for decision-makers and the public.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-[#021d49] rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-gray-700"><strong>Providing mentorship and editorial
                                                            support:</strong> By establishing mentorship networks and peer review
                                                            communities, the Academy will guide early-career researchers through the
                                                            publishing journey, enhancing confidence and success rates.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-[#021d49] rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-gray-700"><strong>Expanding access to publishing
                                                            networks:</strong> Through ARIN's partnerships and outreach to
                                                            additional publishers, the Academy will help reduce publication barriers,
                                                            facilitate co-authorships, and amplify African research globally.</p>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-2 h-2 bg-[#021d49] rounded-full mt-2 flex-shrink-0"></div>
                                                        <p className="text-gray-700"><strong>Promoting open-access and digital
                                                            dissemination:</strong> The Academy will encourage the use of
                                                            open-access platforms and digital tools to maximize visibility, reach
                                                            broader audiences, and increase citation impact.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Objectives Section */}
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Objectives of the ARIN Publishing Academy
                                        </h3>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div
                                                    className="w-8 h-8 bg-[#021d49] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                    a</div>
                                                <p className="text-gray-700">Strengthen research and writing capacity for early-career
                                                    and established African researchers, as well as professionals seeking to produce
                                                    high-quality academic, empirical, and policy-oriented outputs.</p>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                                <div
                                                    className="w-8 h-8 bg-green-700 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                    b</div>
                                                <p className="text-gray-700">Build inclusive mentorship and publishing networks by
                                                    connecting participants with senior researchers, journal editors, and policy
                                                    communication experts, and facilitating access to reputable journals through ARIN's
                                                    publishing partnerships.</p>
                                            </div>
                                            <div
                                                className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                                <div
                                                    className="w-8 h-8 bg-purple-700 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                    c</div>
                                                <p className="text-gray-700">Enhance data literacy and research quality through regular
                                                    training in data management, analysis, visualization, and ethical research practices
                                                    to improve the rigor and credibility of African scholarship.</p>
                                            </div>
                                            <div
                                                className="flex items-start gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                                <div
                                                    className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                    d</div>
                                                <p className="text-gray-700">Advance knowledge translation and policy engagement by
                                                    equipping participants with the skills to develop policy briefs, op-eds, technical
                                                    papers, and advocacy materials that inform decision-making.</p>
                                            </div>
                                            <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-lg border border-pink-200">
                                                <div
                                                    className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                                    e</div>
                                                <p className="text-gray-700">Promote innovative and open dissemination pathways by
                                                    leveraging digital tools, open-access models, artificial intelligence, and ARIN's
                                                    interactive data platforms to increase research visibility, sharing, and impact.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Structure and Implementation Section */}
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Structure and Implementation</h3>

                                        <div className="space-y-6">
                                            {/* Training Modules */}
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Training Modules/Areas of Coverage
                                                </h4>
                                                <p className="text-gray-700 mb-4">The Academy will offer structured training modules
                                                    covering:</p>
                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div
                                                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                                        <h5 className="font-bold text-gray-900 mb-2">Academic Writing Mastery</h5>
                                                        <p className="text-sm text-gray-700">Research design, manuscript preparation,
                                                            and journal selection strategies.</p>
                                                    </div>
                                                    <div
                                                        className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                                        <h5 className="font-bold text-gray-900 mb-2">Navigating the Publishing Process
                                                        </h5>
                                                        <p className="text-sm text-gray-700">Responding to peer reviews, addressing
                                                            editorial feedback, and avoiding predatory journals.</p>
                                                    </div>
                                                    <div
                                                        className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                                        <h5 className="font-bold text-gray-900 mb-2">Research Impact and Open Science
                                                        </h5>
                                                        <p className="text-sm text-gray-700">Open-access publishing, research metrics,
                                                            and increasing global visibility.</p>
                                                    </div>
                                                    <div
                                                        className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                                        <h5 className="font-bold text-gray-900 mb-2">Science Communication for Policy
                                                        </h5>
                                                        <p className="text-sm text-gray-700">Writing policy briefs, media engagement,
                                                            and storytelling for non-academic audiences.</p>
                                                    </div>
                                                    <div
                                                        className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200 sm:col-span-2">
                                                        <h5 className="font-bold text-gray-900 mb-2">Ethical Publishing and Research
                                                            Integrity</h5>
                                                        <p className="text-sm text-gray-700">Plagiarism prevention, data transparency,
                                                            and responsible authorship.</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Incentives */}
                                            <div
                                                className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Incentives and Continued Engagement
                                                </h4>
                                                <p className="text-gray-700 mb-4">To foster sustained engagement, motivation, and
                                                    long-term value for participants, the Academy will integrate:</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Award className="text-[#021d49]" size={20} />
                                                        <span className="text-gray-700"><strong>Certification and Recognition:</strong>
                                                            Formal certificates upon module completion</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="text-green-600" size={20} />
                                                        <span className="text-gray-700"><strong>Career Development Pathways:</strong>
                                                            Access to funding calls and research fellowships</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="text-purple-600" size={20} />
                                                        <span className="text-gray-700"><strong>Alumni Network:</strong> Vibrant
                                                            community for peer learning and collaboration</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Target className="text-orange-600" size={20} />
                                                        <span className="text-gray-700"><strong>Research Competitions and
                                                            Awards:</strong> Recognition for outstanding outputs</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Training Schedule */}
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Training Schedule</h4>
                                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                                    <p className="text-gray-700 mb-4">Training modules will be covered in <strong>Two to
                                                        Three Months</strong> with 2-hour evening sessions (3-5 pm ET) on Tuesdays.
                                                    </p>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm border-collapse">
                                                            <thead>
                                                                <tr className="bg-[#021d49] text-white">
                                                                    <th className="border border-gray-300 p-2">Week</th>
                                                                    <th className="border border-gray-300 p-2">Module</th>
                                                                    <th className="border border-gray-300 p-2">Focus</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-white">WK 1-2</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">Onboarding &
                                                                        Introduction</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">Registration,
                                                                        aims, and trainers</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">WK 3-4</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">M1: Academic
                                                                        Writing Mastery</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">Research
                                                                        design & manuscript prep</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-white">WK 5-6</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">M2-M3: Journal
                                                                        Insights & Process</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">Publishing
                                                                        process & navigation</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">WK 7-8</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">M4-M5:
                                                                        Research & Policy Impact</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">Open science &
                                                                        communication</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-white">WK 9-10</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">M6: Publishing
                                                                        Ethics</td>
                                                                    <td className="border border-gray-300 p-2 bg-white">Integrity &
                                                                        responsible authorship</td>
                                                                </tr>
                                                                <tr>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">WK 11-12</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">Recap &
                                                                        Certification</td>
                                                                    <td className="border border-gray-300 p-2 bg-blue-50">Networking &
                                                                        awards</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Delivery Mechanism */}
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Delivery Mechanism</h4>
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">Workshops & Webinars</div>
                                                        <p className="text-sm text-gray-600">Weekly virtual and in-person sessions</p>
                                                    </div>
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">One-on-One Mentorship</div>
                                                        <p className="text-sm text-gray-600">Personalized guidance and support</p>
                                                    </div>
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">Self-Paced Learning</div>
                                                        <p className="text-sm text-gray-600">Accessible platforms with reviews</p>
                                                    </div>
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">Research Fora</div>
                                                        <p className="text-sm text-gray-600">Weekly peer discussions</p>
                                                    </div>
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">Publishing Fellowships</div>
                                                        <p className="text-sm text-gray-600">Funding and editorial assistance</p>
                                                    </div>
                                                    <div
                                                        className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-[#021d49] transition-all">
                                                        <div className="font-semibold text-gray-900 mb-1">Hybrid Learning Model</div>
                                                        <p className="text-sm text-gray-600">Online and in-person formats</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Institutional Partnerships */}
                                            <div
                                                className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                                <h4 className="text-xl font-bold text-gray-900 mb-3">Institutional Partnerships</h4>
                                                <p className="text-gray-700 mb-3">ARIN will collaborate with:</p>
                                                <div className="space-y-2 text-gray-700">
                                                    <div className="flex items-start gap-2">
                                                        <ChevronRight className="text-purple-600 flex-shrink-0 mt-1" size={18} />
                                                        <span>Universities and research institutions to integrate the Academy into
                                                            existing research training programs</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <ChevronRight className="text-purple-600 flex-shrink-0 mt-1" size={18} />
                                                        <span>International publishers and journals to provide publishing opportunities
                                                            and technical training</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <ChevronRight className="text-purple-600 flex-shrink-0 mt-1" size={18} />
                                                        <span>Science-policy networks to ensure research outputs reach policymakers and
                                                            drive impact</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <ChevronRight className="text-purple-600 flex-shrink-0 mt-1" size={18} />
                                                        <span>Funding organizations and philanthropic entities to ensure sustainability
                                                            and long-term success</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expected Outcomes Section */}
                                    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-100">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Expected Outcomes and Impact</h3>

                                        <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200">
                                            <img src="/image/poster-launch.jpg" alt="Expected Outcomes"
                                                className="w-full h-64 object-cover" />
                                        </div>

                                        <p className="text-gray-700 mb-4">The Publishing Academy aims to achieve the following outcomes:
                                        </p>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Increased high-quality and empirically grounded
                                                        publications by African researchers in reputable journals</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Stronger research-to-policy linkages, ensuring that
                                                        academic outputs inform policy decisions</p>
                                                </div>
                                            </div>
                                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Increased engagement of African scholars with global
                                                        publishing networks such as Taylor & Francis</p>
                                                </div>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Enhanced global visibility of African research,
                                                        contributing to decolonizing knowledge production</p>
                                                </div>
                                            </div>
                                            <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Facilitate regular data management, access, and
                                                        analysis of knowledge-sharing capacity</p>
                                                </div>
                                            </div>
                                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Improve data analysis dissemination skills that match
                                                        Africa's dynamic research landscape</p>
                                                </div>
                                            </div>
                                            <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Strengthened mentorship and scholarly networks,
                                                        fostering long-term collaborations</p>
                                                </div>
                                            </div>
                                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        ✓</div>
                                                    <p className="text-gray-700">Institutionalization of evidence-based policymaking,
                                                        supporting Africa's development agenda</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Funding and Sustainability Section */}
                                    <div className="bg-gradient-to-br from-[#021d49] to-[#1e40af] rounded-2xl shadow-lg p-8 text-white">
                                        <h3 className="text-2xl font-bold mb-4">Funding and Sustainability</h3>
                                        <p className="text-blue-100 mb-6">The Academy will adopt a multi-pronged approach to funding:
                                        </p>

                                        <div className="space-y-3">
                                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                                                <h5 className="font-bold mb-2">ARIN Mini-grants and Mentorship Scheme</h5>
                                                <p className="text-sm text-blue-100">Support early-career researchers with funding and
                                                    mentorship to develop high-quality publications</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                                                <h5 className="font-bold mb-2">International Grants</h5>
                                                <p className="text-sm text-blue-100">Grants from international donors and development
                                                    agencies supporting knowledge production in Africa</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                                                <h5 className="font-bold mb-2">Institutional Partnerships</h5>
                                                <p className="text-sm text-blue-100">Partnerships with universities and research bodies,
                                                    integrating the Academy into their training programs</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                                                <h5 className="font-bold mb-2">Fee-based Training Models</h5>
                                                <p className="text-sm text-blue-100">Specialized data management, analysis, and
                                                    publishing workshops for institutions and individuals</p>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                                                <h5 className="font-bold mb-2">Corporate and Philanthropic Sponsorships</h5>
                                                <p className="text-sm text-blue-100">Leveraging private sector support for research and
                                                    data analysis capacity-building initiatives</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 p-4 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                                            <p className="text-blue-50 italic">
                                                The ARIN Publishing Academy is a critical intervention to enhance research excellence,
                                                strengthen the science-policy interface, and promote Africa-led knowledge production. By
                                                equipping researchers with the skills and opportunities needed for successful publishing
                                                and results dissemination, the Academy will contribute significantly to
                                                evidence-informed policymaking, academic growth, and sustainable development across
                                                Africa.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>


            </div>
            <Footer />

        </>
    );
};

export default AboutUsPage;