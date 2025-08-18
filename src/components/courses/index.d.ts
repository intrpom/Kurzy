// Typové definice pro komponenty v adresáři courses
declare module '@/components/courses/CourseAccessButton' {
  interface CourseAccessButtonProps {
    courseId: string;
    slug: string;
    price: number;
  }
  
  export default function CourseAccessButton(props: CourseAccessButtonProps): JSX.Element;
}

declare module '@/components/courses/CourseDetailClient' {
  interface CourseDetailClientProps {
    courseId: string;
    slug: string;
    price: number;
    children: React.ReactNode;
  }
  
  export default function CourseDetailClient(props: CourseDetailClientProps): JSX.Element;
}
